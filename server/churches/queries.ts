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
    })
    .from(churches)
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
