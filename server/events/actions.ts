"use server";

/**
 * Gestión de eventos (pastores/líderes verificados de ESA iglesia, o admin).
 * La iglesia del evento se toma SIEMPRE de la base para editar/borrar (nunca
 * del cliente), evitando que alguien modifique eventos de otra iglesia.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLog, churchEvents } from "@/db/schema";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { consumeRateLimit, RATE_LIMITS } from "@/server/platform/rate-limit";
import { eventSchema, type EventInput } from "./validation";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidate(churchId: string) {
  revalidatePath("/eventos");
  revalidatePath("/pastoral/eventos");
  revalidatePath(`/pastoral`);
  void churchId;
}

export async function createEvent(churchId: string, input: EventInput): Promise<ActionResult> {
  const actor = await getActor();
  if (!can(actor, "church:manage_events", { churchId })) {
    return { ok: false, error: "No tenés permiso para gestionar eventos de esta iglesia." };
  }
  const rl = await consumeRateLimit(RATE_LIMITS.write, `u:${actor.userId}`);
  if (!rl.allowed) return { ok: false, error: "Demasiadas operaciones. Esperá un momento." };
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  try {
    const db = getDb();
    const [row] = await db
      .insert(churchEvents)
      .values({ churchId, createdBy: actor.userId, ...parsed.data })
      .returning({ id: churchEvents.id });
    await db.insert(auditLog).values({
      actorUserId: actor.userId,
      action: "event.create",
      entity: "church_event",
      entityId: row!.id,
      churchId,
    });
    revalidate(churchId);
    return { ok: true, id: row!.id };
  } catch {
    return { ok: false, error: "No se pudo crear el evento." };
  }
}

async function loadChurchId(eventId: string): Promise<string | null> {
  const rows = await getDb()
    .select({ churchId: churchEvents.churchId })
    .from(churchEvents)
    .where(eq(churchEvents.id, eventId))
    .limit(1);
  return rows[0]?.churchId ?? null;
}

export async function updateEvent(eventId: string, input: EventInput): Promise<ActionResult> {
  const actor = await getActor();
  const churchId = await loadChurchId(eventId).catch(() => null);
  if (!churchId || !can(actor, "church:manage_events", { churchId })) {
    return { ok: false, error: "No tenés permiso para editar este evento." };
  }
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  try {
    const db = getDb();
    await db
      .update(churchEvents)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(churchEvents.id, eventId));
    await db.insert(auditLog).values({
      actorUserId: actor.userId,
      action: "event.update",
      entity: "church_event",
      entityId: eventId,
      churchId,
    });
    revalidate(churchId);
    revalidatePath(`/eventos/${eventId}`);
    return { ok: true, id: eventId };
  } catch {
    return { ok: false, error: "No se pudo actualizar el evento." };
  }
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const actor = await getActor();
  const churchId = await loadChurchId(eventId).catch(() => null);
  if (!churchId || !can(actor, "church:manage_events", { churchId })) {
    return { ok: false, error: "No tenés permiso para borrar este evento." };
  }
  try {
    const db = getDb();
    await db.delete(churchEvents).where(eq(churchEvents.id, eventId));
    await db.insert(auditLog).values({
      actorUserId: actor.userId,
      action: "event.delete",
      entity: "church_event",
      entityId: eventId,
      churchId,
    });
    revalidate(churchId);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo borrar el evento." };
  }
}
