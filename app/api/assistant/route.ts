import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, like, not, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { aiUsage, subscriptions } from "@/db/schema";
import { env } from "@/lib/env";
import { getLLMProvider } from "@/server/ai/provider";
import { runAssistant } from "@/server/ai/assistant";
import {
  retrieveByReference,
  retrieveCombined,
  dbFetchVerse,
  dbSearchVerses,
} from "@/server/ai/rag";
import { checkDailyLimit, usageDay } from "@/server/ai/limits";
import { persistTurn, recentMessages } from "@/server/ai/conversations";
import { findCachedAnswer, storeCachedAnswer } from "@/server/ai/cache";
import { estimateCostMicros } from "@/server/ai/costs";
import { consumeRateLimit, identityFrom, RATE_LIMITS } from "@/server/platform/rate-limit";
import { track } from "@/server/platform/analytics";
import type { ChatMessage } from "@/server/ai/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  conversationId: z.string().min(1).max(64).optional(),
  // Compatibilidad: el cliente puede enviar el historial, pero el servidor
  // SOLO usa el último mensaje del usuario; el contexto previo se lee de la DB
  // (evita que un cliente inyecte turnos falsos del asistente).
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});

function lastUserText(messages: { role: string; content: string }[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.role === "user") return messages[i]!.content;
  }
  return "";
}

export async function POST(req: Request) {
  // 1. Autenticación (server-side).
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  // 2. Validación de entrada.
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Entrada inválida." }, { status: 400 });
  }
  const question = lastUserText(parsed.data.messages).trim();
  if (!question) {
    return NextResponse.json({ error: "Escribí una pregunta." }, { status: 400 });
  }

  // 3. Configuración disponible (sin falsos verdes).
  if (!env.OPENAI_API_KEY || !env.DATABASE_URL) {
    return NextResponse.json(
      {
        error:
          "El asistente no está configurado en este entorno (faltan OPENAI_API_KEY " +
          "y/o DATABASE_URL).",
      },
      { status: 503 },
    );
  }

  // 4. Rate limiting anti-abuso (ráfagas). Independiente del cupo diario.
  const rl = await consumeRateLimit(RATE_LIMITS.assistant, identityFrom(userId, req.headers));
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Estás enviando mensajes muy rápido. Esperá un momento e intentá de nuevo." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000)) } },
    );
  }

  const db = getDb();
  const day = usageDay();

  try {
    const provider = await getLLMProvider();
    const fetchVerse = dbFetchVerse();
    const searchVerses = dbSearchVerses();

    // Memoria bajo control de privacidad: historial propio desde la DB.
    const history: ChatMessage[] = parsed.data.conversationId
      ? await recentMessages(userId, parsed.data.conversationId, 10)
      : [];
    const messages: ChatMessage[] = [...history, { role: "user", content: question }];

    const result = await runAssistant(messages, {
      provider,
      retrieve: (q) =>
        retrieveCombined(q, (x) => retrieveByReference(x, fetchVerse), searchVerses),
      verseExists: (book, chapter, verse) =>
        fetchVerse(book.name, chapter, verse).then((t) => t !== null),
      country: "AR",
      cache: { find: findCachedAnswer, store: storeCachedAnswer },
      // El cupo diario se consulta SOLO si hay que llamar al modelo (la
      // respuesta de crisis y las respuestas curadas/caché no lo consumen).
      checkLimit: async () => {
        const sub = await db
          .select({ planId: subscriptions.planId })
          .from(subscriptions)
          .where(eq(subscriptions.userId, userId))
          .limit(1);
        const used = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(aiUsage)
          .where(
            and(
              eq(aiUsage.userId, userId),
              eq(aiUsage.day, day),
              not(like(aiUsage.model, "cache:%")),
            ),
          );
        return checkDailyLimit(sub[0]?.planId ?? "free", used[0]?.count ?? 0);
      },
    });

    if (result.source === "limit") {
      return NextResponse.json(
        { error: result.text, limit: result.limit?.limit },
        { status: 429 },
      );
    }

    // Persistir el turno (historial privado) y registrar uso SIN contenido.
    const conversationId = await persistTurn({
      userId,
      conversationId: parsed.data.conversationId,
      userText: question,
      assistantText: result.text,
      citations: result.citations,
    });

    if (result.source !== "crisis") {
      const tokensIn = result.usage?.tokensIn ?? 0;
      const tokensOut = result.usage?.tokensOut ?? 0;
      const model = result.source === "model" ? provider.model : `cache:${result.source}`;
      await db.insert(aiUsage).values({
        userId,
        day,
        model,
        tokensIn,
        tokensOut,
        costEstimate: result.source === "model" ? estimateCostMicros(provider.model, tokensIn, tokensOut) : 0,
      });
    }
    void track("assistant_answer", result.source);

    return NextResponse.json({
      conversationId,
      text: result.text,
      flag: result.flag,
      source: result.source,
      citations: result.citations.map((c) => ({ ref: c.raw, verified: c.verified })),
      remaining:
        result.source === "model" && result.limit ? Math.max(0, result.limit.remaining - 1) : result.limit?.remaining,
    });
  } catch (err) {
    console.error("Error en el asistente:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json(
      { error: "El asistente no pudo responder en este momento." },
      { status: 502 },
    );
  }
}
