/**
 * Consultas de eventos. Públicos: solo de iglesias VERIFICADAS y visibilidad
 * `public`. Los de "miembros" se muestran solo a miembros activos o gestores
 * de esa iglesia (decisión en el servidor, no en la UI).
 */
import "server-only";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { dbOrNull } from "@/db";
import { churchEvents, churches, churchMembers } from "@/db/schema";
import type { Actor } from "@/server/authz/permissions";
import { can } from "@/server/authz/permissions";

const eventFields = {
  id: churchEvents.id,
  title: churchEvents.title,
  description: churchEvents.description,
  location: churchEvents.location,
  onlineUrl: churchEvents.onlineUrl,
  startsAt: churchEvents.startsAt,
  endsAt: churchEvents.endsAt,
  visibility: churchEvents.visibility,
  churchId: churchEvents.churchId,
  churchName: churches.name,
  churchSlug: churches.slug,
  churchLocation: churches.generalLocation,
};

/** Eventos públicos próximos (incluye los que empezaron hace < 3 h). */
export async function listPublicUpcomingEvents(opts: { search?: string; limit?: number } = {}) {
  const db = dbOrNull();
  if (!db) return null;
  const since = new Date(Date.now() - 3 * 3_600_000);
  return db
    .select(eventFields)
    .from(churchEvents)
    .innerJoin(churches, eq(churches.id, churchEvents.churchId))
    .where(
      and(
        eq(churches.status, "verified"),
        eq(churchEvents.visibility, "public"),
        gte(churchEvents.startsAt, since),
        opts.search
          ? sql`(${churchEvents.title} ilike ${"%" + opts.search + "%"} or ${churches.generalLocation} ilike ${"%" + opts.search + "%"} or ${churches.name} ilike ${"%" + opts.search + "%"})`
          : undefined,
      ),
    )
    .orderBy(asc(churchEvents.startsAt))
    .limit(opts.limit ?? 50);
}

async function isActiveMember(userId: string, churchId: string) {
  const db = dbOrNull();
  if (!db) return false;
  const rows = await db
    .select({ u: churchMembers.userId })
    .from(churchMembers)
    .where(
      and(
        eq(churchMembers.userId, userId),
        eq(churchMembers.churchId, churchId),
        eq(churchMembers.status, "active"),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Evento por id, respetando visibilidad. `null` si no existe o no es visible. */
export async function getVisibleEvent(id: string, actor: Actor) {
  const db = dbOrNull();
  if (!db) return null;
  const rows = await db
    .select(eventFields)
    .from(churchEvents)
    .innerJoin(churches, eq(churches.id, churchEvents.churchId))
    .where(and(eq(churchEvents.id, id), eq(churches.status, "verified")))
    .limit(1);
  const e = rows[0];
  if (!e) return null;
  if (e.visibility === "public") return e;
  if (can(actor, "church:manage_events", { churchId: e.churchId })) return e;
  if (actor.userId && (await isActiveMember(actor.userId, e.churchId))) return e;
  return null;
}

/** Eventos de una iglesia para su panel (incluye pasados recientes). */
export async function listChurchEventsForManagement(churchId: string) {
  const db = dbOrNull();
  if (!db) return [];
  const since = new Date(Date.now() - 30 * 86_400_000);
  return db
    .select(eventFields)
    .from(churchEvents)
    .innerJoin(churches, eq(churches.id, churchEvents.churchId))
    .where(and(eq(churchEvents.churchId, churchId), gte(churchEvents.startsAt, since)))
    .orderBy(desc(churchEvents.startsAt))
    .limit(100);
}

/** Próximos eventos de una iglesia visibles para el actor (perfil público). */
export async function listChurchUpcomingVisible(churchId: string, actor: Actor) {
  const db = dbOrNull();
  if (!db) return [];
  const manage = can(actor, "church:manage_events", { churchId });
  const member = !manage && actor.userId ? await isActiveMember(actor.userId, churchId) : false;
  const visibilities = manage || member ? ["public", "members"] : ["public"];
  return db
    .select(eventFields)
    .from(churchEvents)
    .innerJoin(churches, eq(churches.id, churchEvents.churchId))
    .where(
      and(
        eq(churchEvents.churchId, churchId),
        inArray(churchEvents.visibility, visibilities),
        gte(churchEvents.startsAt, new Date(Date.now() - 3 * 3_600_000)),
      ),
    )
    .orderBy(asc(churchEvents.startsAt))
    .limit(20);
}

/** Todos los eventos (administración general). */
export async function listAllEventsForAdmin() {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select(eventFields)
    .from(churchEvents)
    .innerJoin(churches, eq(churches.id, churchEvents.churchId))
    .orderBy(desc(churchEvents.startsAt))
    .limit(200);
}
