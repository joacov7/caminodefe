"use server";

/**
 * Pedidos de oración. La persona decide el alcance; el equipo pastoral solo
 * puede marcar "estamos orando". Validación y permisos en el servidor; la RLS
 * y un trigger en la base lo refuerzan (migraciones 0012/0013).
 */
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb, withUserContext } from "@/db";
import { churchMembers, churches, prayerRequests } from "@/db/schema";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { consumeRateLimit, RATE_LIMITS } from "@/server/platform/rate-limit";
import { track } from "@/server/platform/analytics";
import { prayerSchema, answerSchema, type PrayerInput } from "./validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function isActiveMemberOfVerified(userId: string, churchId: string) {
  const rows = await getDb()
    .select({ id: churches.id })
    .from(churchMembers)
    .innerJoin(churches, eq(churches.id, churchMembers.churchId))
    .where(
      and(
        eq(churchMembers.userId, userId),
        eq(churchMembers.churchId, churchId),
        eq(churchMembers.status, "active"),
        eq(churches.status, "verified"),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function createPrayer(input: PrayerInput): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor.userId) return { ok: false, error: "Iniciá sesión para guardar tu pedido." };
  const userId = actor.userId;
  const parsed = prayerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const d = parsed.data;
  const rl = await consumeRateLimit(RATE_LIMITS.write, `u:${userId}`);
  if (!rl.allowed) return { ok: false, error: "Demasiadas operaciones. Esperá un momento." };
  try {
    // Solo se comparte con una iglesia verificada de la que la persona es miembro.
    if (d.scope === "church" && !(await isActiveMemberOfVerified(userId, d.churchId!))) {
      return { ok: false, error: "Podés compartirlo con una iglesia de la que seas miembro." };
    }
    await withUserContext(userId, (db) => [db.insert(prayerRequests).values({ userId, ...d })]);
    void track("prayer_request_created", d.scope);
    revalidatePath("/oracion");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar el pedido." };
  }
}

export async function markPrayerAnswered(id: string, note?: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor.userId) return { ok: false, error: "No autenticado." };
  const userId = actor.userId;
  const parsed = answerSchema.safeParse(note);
  if (!parsed.success) return { ok: false, error: "El testimonio es demasiado largo." };
  try {
    await withUserContext(userId, (db) => [
      db
        .update(prayerRequests)
        .set({ status: "answered", answerNote: parsed.data || null, updatedAt: new Date() })
        .where(and(eq(prayerRequests.id, id), eq(prayerRequests.userId, userId))),
    ]);
    revalidatePath("/oracion");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}

export async function deletePrayer(id: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor.userId) return { ok: false, error: "No autenticado." };
  const userId = actor.userId;
  try {
    await withUserContext(userId, (db) => [
      db.delete(prayerRequests).where(and(eq(prayerRequests.id, id), eq(prayerRequests.userId, userId))),
    ]);
    revalidatePath("/oracion");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo borrar." };
  }
}

/** El equipo pastoral indica que está orando (único cambio que puede hacer). */
export async function markPraying(id: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor.userId) return { ok: false, error: "No autenticado." };
  const pastorId = actor.userId;
  try {
    // La RLS solo devuelve el pedido si fue compartido con una iglesia que
    // este usuario gestiona; además se verifica el permiso en la matriz.
    const [rows] = await withUserContext(pastorId, (db) => [
      db
        .select({ churchId: prayerRequests.churchId, status: prayerRequests.status })
        .from(prayerRequests)
        .where(eq(prayerRequests.id, id))
        .limit(1),
    ]);
    const row = rows[0];
    if (!row?.churchId || !can(actor, "church:manage_contact_requests", { churchId: row.churchId })) {
      return { ok: false, error: "No autorizado." };
    }
    if (row.status !== "open") return { ok: true };
    await withUserContext(pastorId, (db) => [
      db.update(prayerRequests).set({ status: "praying", updatedAt: new Date() }).where(eq(prayerRequests.id, id)),
    ]);
    revalidatePath("/pastoral/oracion");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}
