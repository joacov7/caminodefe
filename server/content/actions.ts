"use server";

/**
 * Server actions de contenidos (contenido de plataforma). Requieren rol de
 * gestión y validan todo en el servidor.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { contentItems, auditLog } from "@/db/schema";
import { getActor } from "@/server/authz/session";
import { canManageContent } from "./access";
import {
  contentSchema,
  canTransition,
  type ContentInput,
  type EditorialStatus,
} from "./editorial";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** Crea contenido de PLATAFORMA (churchId null) en estado borrador. */
export async function createPlatformContent(
  input: ContentInput,
): Promise<ActionResult<{ id: string }>> {
  const actor = await getActor();
  if (!canManageContent(actor, null)) {
    return { ok: false, error: "No autorizado." };
  }
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  try {
    const rows = await getDb()
      .insert(contentItems)
      .values({ ...parsed.data, churchId: null, editorialStatus: "draft" })
      .returning({ id: contentItems.id });
    revalidatePath("/admin/contenido");
    return { ok: true, data: { id: rows[0]!.id } };
  } catch {
    return { ok: false, error: "No se pudo crear el contenido." };
  }
}

/** Avanza el estado editorial de un contenido, respetando la máquina de estados. */
export async function setContentStatus(
  id: string,
  next: EditorialStatus,
): Promise<ActionResult> {
  const actor = await getActor();
  try {
    const db = getDb();
    const rows = await db
      .select({
        churchId: contentItems.churchId,
        status: contentItems.editorialStatus,
      })
      .from(contentItems)
      .where(eq(contentItems.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return { ok: false, error: "Contenido no encontrado." };

    if (!canManageContent(actor, row.churchId)) {
      return { ok: false, error: "No autorizado." };
    }
    if (!canTransition(row.status as EditorialStatus, next)) {
      return { ok: false, error: "Transición no permitida." };
    }

    await db
      .update(contentItems)
      .set({
        editorialStatus: next,
        publishedAt: next === "published" ? new Date() : null,
      })
      .where(eq(contentItems.id, id));

    if (next === "published" || row.status === "published") {
      await db.insert(auditLog).values({
        actorUserId: actor.userId,
        action: "content.set_status",
        entity: "content_item",
        entityId: id,
        churchId: row.churchId,
        metadata: { from: row.status, to: next },
      });
    }
    revalidatePath("/admin/contenido");
    revalidatePath("/contenidos");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el estado." };
  }
}
