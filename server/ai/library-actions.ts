"use server";

/**
 * Biblioteca curada del asistente: preguntas frecuentes con respuestas
 * escritas o revisadas por personas, aprobadas por moderación/consejo.
 * Flujo: borrador → revisión → aprobado → publicado (mismo que contenidos).
 * Principio de "cuatro ojos": quien aprueba no debería ser quien redactó; solo
 * un admin de plataforma puede auto-aprobar y queda registrado en auditoría.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { answerLibrary, auditLog } from "@/db/schema";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { canTransition, type EditorialStatus } from "@/server/content/editorial";
import { normalizeQuestion } from "./cache-policy";
import { invalidateAnswerCache } from "./cache";
import { env } from "@/lib/env";

export type ActionResult = { ok: true } | { ok: false; error: string };

const entrySchema = z.object({
  question: z.string().trim().min(8, "Pregunta muy corta.").max(300),
  answer: z.string().trim().min(40, "Respuesta muy corta.").max(6000),
});

export async function createLibraryEntry(input: { question: string; answer: string }): Promise<ActionResult> {
  const actor = await getActor();
  if (!can(actor, "library:review")) return { ok: false, error: "No autorizado." };
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  try {
    await getDb().insert(answerLibrary).values({
      question: parsed.data.question,
      normalizedQuestion: normalizeQuestion(parsed.data.question),
      answer: parsed.data.answer,
      status: "draft",
      createdBy: actor.userId,
    });
    revalidatePath("/admin/biblioteca");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar." };
  }
}

async function embedQuestion(text: string): Promise<number[] | null> {
  if (!env.OPENAI_API_KEY) return null;
  try {
    const { getLLMProvider } = await import("./provider");
    const p = await getLLMProvider();
    return (await p.embed([text]))[0] ?? null;
  } catch {
    return null;
  }
}

export async function setLibraryStatus(id: string, next: EditorialStatus): Promise<ActionResult> {
  const actor = await getActor();
  if (!can(actor, "library:review")) return { ok: false, error: "No autorizado." };
  const db = getDb();
  const [row] = await db
    .select({ status: answerLibrary.status, createdBy: answerLibrary.createdBy, question: answerLibrary.question })
    .from(answerLibrary)
    .where(eq(answerLibrary.id, id))
    .limit(1);
  if (!row) return { ok: false, error: "Entrada no encontrada." };
  if (!canTransition(row.status as EditorialStatus, next)) return { ok: false, error: "Transición no permitida." };

  const selfApproval = next === "approved" && row.createdBy === actor.userId;
  if (selfApproval && !can(actor, "plans:configure")) {
    return { ok: false, error: "La aprobación debe hacerla otra persona (revisión de cuatro ojos)." };
  }
  try {
    // Al publicar se calcula el embedding (si hay proveedor) para coincidencias
    // por similitud; sin él, la biblioteca funciona por coincidencia exacta.
    const embedding = next === "published" ? await embedQuestion(row.question) : undefined;
    await db
      .update(answerLibrary)
      .set({
        status: next,
        ...(next === "approved" ? { reviewedBy: actor.userId, reviewedAt: new Date() } : {}),
        ...(embedding !== undefined ? { embedding } : {}),
      })
      .where(eq(answerLibrary.id, id));
    await db.insert(auditLog).values({
      actorUserId: actor.userId,
      action: "library.set_status",
      entity: "answer_library",
      entityId: id,
      metadata: { from: row.status, to: next, selfApproval },
    });
    revalidatePath("/admin/biblioteca");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}

export async function retireLibraryEntry(id: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!can(actor, "library:review")) return { ok: false, error: "No autorizado." };
  await getDb().update(answerLibrary).set({ retiredAt: new Date(), status: "review" }).where(eq(answerLibrary.id, id));
  revalidatePath("/admin/biblioteca");
  return { ok: true };
}

/** Purga la caché por similitud (p. ej. tras cambiar la declaración doctrinal). */
export async function purgeAnswerCache(): Promise<ActionResult & { purged?: number }> {
  const actor = await getActor();
  if (!can(actor, "library:review")) return { ok: false, error: "No autorizado." };
  const purged = await invalidateAnswerCache();
  await getDb().insert(auditLog).values({
    actorUserId: actor.userId,
    action: "cache.purge",
    entity: "answer_cache",
    metadata: { purged },
  });
  revalidatePath("/admin/biblioteca");
  return { ok: true, purged };
}
