import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { aiUsage, subscriptions } from "@/db/schema";
import { env } from "@/lib/env";
import { getLLMProvider } from "@/server/ai/provider";
import { runAssistant } from "@/server/ai/assistant";
import { retrieveByReference, dbFetchVerse } from "@/server/ai/rag";
import { checkDailyLimit, usageDay } from "@/server/ai/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
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

  const db = getDb();
  const day = usageDay();

  // 4. Límite por plan.
  const sub = await db
    .select({ planId: subscriptions.planId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  const planId = sub[0]?.planId ?? "free";

  const usedRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)));
  const usedToday = usedRows[0]?.count ?? 0;

  const decision = checkDailyLimit(planId, usedToday);
  if (!decision.allowed) {
    return NextResponse.json(
      {
        error:
          "Alcanzaste el límite diario de tu plan. Volvé mañana o mejorá tu plan. " +
          "El acceso a recursos gratuitos y de emergencia sigue disponible.",
        limit: decision.limit,
      },
      { status: 429 },
    );
  }

  // 5. Ejecutar el asistente.
  try {
    const provider = await getLLMProvider();
    const fetchVerse = dbFetchVerse();
    const result = await runAssistant(parsed.data.messages, {
      provider,
      retrieve: (q) => retrieveByReference(q, fetchVerse),
      verseExists: (book, chapter, verse) =>
        fetchVerse(book.name, chapter, verse).then((t) => t !== null),
      country: "AR",
    });

    // 6. Registrar uso (métricas técnicas, sin contenido personal).
    await db.insert(aiUsage).values({
      userId,
      day,
      model: provider.model,
      tokensIn: result.usage?.tokensIn ?? 0,
      tokensOut: result.usage?.tokensOut ?? 0,
    });

    return NextResponse.json({
      text: result.text,
      flag: result.flag,
      citations: result.citations.map((c) => ({
        ref: c.raw,
        verified: c.verified,
      })),
      remaining: decision.remaining - 1,
    });
  } catch (err) {
    console.error("Error en el asistente:", err);
    return NextResponse.json(
      { error: "El asistente no pudo responder en este momento." },
      { status: 502 },
    );
  }
}
