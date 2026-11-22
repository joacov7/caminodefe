/**
 * Consultas del módulo de iglesias (server-side). Devuelven `null` cuando la
 * base no está configurada, para que la UI muestre un estado claro.
 */
import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  churches,
  serviceTimes,
  churchEvents,
  churchMembers,
  contactRequests,
  users,
} from "@/db/schema";

function dbOrNull() {
  try {
    return getDb();
  } catch {
    return null;
  }
}

export type PublicChurch = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  doctrinalStatement: string | null;
  generalLocation: string | null;
  website: string | null;
};

export async function getVerifiedChurchBySlug(
  slug: string,
): Promise<PublicChurch | null> {
  const db = dbOrNull();
  if (!db) return null;
  const rows = await db
    .select({
      id: churches.id,
      name: churches.name,
      slug: churches.slug,
      description: churches.description,
      doctrinalStatement: churches.doctrinalStatement,
      generalLocation: churches.generalLocation,
      website: churches.website,
    })
    .from(churches)
    .where(and(eq(churches.slug, slug), eq(churches.status, "verified")))
    .limit(1);
  return rows[0] ?? null;
}

export async function listVerifiedChurches(
  search?: string,
): Promise<PublicChurch[] | null> {
  const db = dbOrNull();
  if (!db) return null;
  const base = and(
    eq(churches.status, "verified"),
    search
      ? or(
          ilike(churches.name, `%${search}%`),
          ilike(churches.generalLocation, `%${search}%`),
        )
      : undefined,
  );
  return db
    .select({
      id: churches.id,
      name: churches.name,
      slug: churches.slug,
      description: churches.description,
      doctrinalStatement: churches.doctrinalStatement,
      generalLocation: churches.generalLocation,
      website: churches.website,
    })
    .from(churches)
    .where(base)
    .orderBy(asc(churches.name))
    .limit(50);
}

/** Resumen de las iglesias que gestiona un usuario (para el panel pastoral). */
export async function getChurchesByIds(ids: string[]) {
  const db = dbOrNull();
  if (!db || ids.length === 0) return [];
  return db
    .select({
      id: churches.id,
      name: churches.name,
      slug: churches.slug,
      status: churches.status,
      plan: churches.plan,
    })
    .from(churches)
    .where(inArray(churches.id, ids))
    .orderBy(asc(churches.name));
}

/** Todas las iglesias, para el panel de verificación (admin de plataforma). */
export async function listAllChurches() {
  const db = dbOrNull();
  if (!db) return null;
  return db
    .select({
      id: churches.id,
      name: churches.name,
      slug: churches.slug,
      status: churches.status,
      generalLocation: churches.generalLocation,
      contact: churches.contact,
      plan: churches.plan,
      requesterName: users.name,
      requesterEmail: users.email,
    })
    .from(churches)
    // Quién solicitó el alta (para verificar identidad y rol antes de aprobar).
    .leftJoin(users, sql`${users.id} = ${churches.contact}->>'requestedBy'`)
    .orderBy(desc(churches.createdAt))
    .limit(200);
}

export async function getServiceTimes(churchId: string) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select()
    .from(serviceTimes)
    .where(eq(serviceTimes.churchId, churchId));
}

export async function getUpcomingEvents(churchId: string, publicOnly = true) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select()
    .from(churchEvents)
    .where(
      and(
        eq(churchEvents.churchId, churchId),
        gte(churchEvents.startsAt, new Date()),
        publicOnly ? eq(churchEvents.visibility, "public") : undefined,
      ),
    )
    .orderBy(asc(churchEvents.startsAt))
    .limit(20);
}

export async function listContactRequests(churchId: string) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select()
    .from(contactRequests)
    .where(eq(contactRequests.churchId, churchId))
    .orderBy(desc(contactRequests.createdAt))
    .limit(100);
}

/** Estadísticas agregadas (nunca datos privados de miembros). */
export async function getChurchStats(churchId: string) {
  const db = dbOrNull();
  if (!db) return null;
  const count = (v: number | undefined) => v ?? 0;

  const [members] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(churchMembers)
    .where(
      and(eq(churchMembers.churchId, churchId), eq(churchMembers.status, "active")),
    );
  const [events] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(churchEvents)
    .where(eq(churchEvents.churchId, churchId));
  const [pending] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contactRequests)
    .where(
      and(
        eq(contactRequests.churchId, churchId),
        eq(contactRequests.status, "sent"),
      ),
    );

  return {
    activeMembers: count(members?.n),
    events: count(events?.n),
    pendingRequests: count(pending?.n),
  };
}

/**
 * Personas vinculadas a una iglesia (para su equipo pastoral). Solo nombre y
 * correo — datos que la persona compartió al pedir ser miembro. Nunca datos
 * privados (diario, notas, conversaciones, progreso).
 */
export async function listChurchMembers(churchId: string) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select({
      userId: churchMembers.userId,
      status: churchMembers.status,
      linkedAt: churchMembers.linkedAt,
      name: users.name,
      email: users.email,
    })
    .from(churchMembers)
    .innerJoin(users, eq(users.id, churchMembers.userId))
    .where(and(eq(churchMembers.churchId, churchId), inArray(churchMembers.status, ["requested", "active"])))
    .orderBy(desc(churchMembers.linkedAt))
    .limit(500);
}

/** Iglesias con las que la persona está vinculada (su propia vista). */
export async function listMyChurches(userId: string) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select({
      churchId: churchMembers.churchId,
      status: churchMembers.status,
      name: churches.name,
      slug: churches.slug,
    })
    .from(churchMembers)
    .innerJoin(churches, eq(churches.id, churchMembers.churchId))
    .where(and(eq(churchMembers.userId, userId), inArray(churchMembers.status, ["requested", "active"])));
}

export async function getMembershipStatus(userId: string, churchId: string) {
  const db = dbOrNull();
  if (!db) return null;
  const rows = await db
    .select({ status: churchMembers.status })
    .from(churchMembers)
    .where(and(eq(churchMembers.userId, userId), eq(churchMembers.churchId, churchId)))
    .limit(1);
  return rows[0]?.status ?? null;
}

/** Solicitudes de contacto de la propia persona (para verlas y retirarlas). */
export async function listMyContactRequests(userId: string) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select({
      id: contactRequests.id,
      reason: contactRequests.reason,
      status: contactRequests.status,
      createdAt: contactRequests.createdAt,
      churchName: churches.name,
      churchSlug: churches.slug,
    })
    .from(contactRequests)
    .innerJoin(churches, eq(churches.id, contactRequests.churchId))
    .where(eq(contactRequests.userId, userId))
    .orderBy(desc(contactRequests.createdAt))
    .limit(50);
}
