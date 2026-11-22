/**
 * Consultas de pedidos de oración. Siempre con `withUserContext`: la RLS
 * (0012) decide qué filas ve cada quien — la persona, todo lo suyo; el equipo
 * pastoral, SOLO lo compartido con su iglesia verificada.
 */
import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { dbOrNull, withUserContext } from "@/db";
import { prayerRequests, users, churches } from "@/db/schema";

export async function listMyPrayers(userId: string) {
  if (!dbOrNull()) return [];
  const [rows] = await withUserContext(userId, (db) => [
    db
      .select({
        id: prayerRequests.id,
        body: prayerRequests.body,
        scope: prayerRequests.scope,
        anonymous: prayerRequests.anonymous,
        status: prayerRequests.status,
        answerNote: prayerRequests.answerNote,
        createdAt: prayerRequests.createdAt,
        churchName: churches.name,
      })
      .from(prayerRequests)
      .leftJoin(churches, eq(churches.id, prayerRequests.churchId))
      .where(eq(prayerRequests.userId, userId))
      .orderBy(desc(prayerRequests.createdAt))
      .limit(200),
  ]);
  return rows;
}

/**
 * Pedidos compartidos con una iglesia, vistos por un integrante de su equipo
 * pastoral. El nombre solo se muestra si la persona NO eligió anonimato.
 */
export async function listChurchPrayers(pastorUserId: string, churchId: string) {
  if (!dbOrNull()) return [];
  const [rows] = await withUserContext(pastorUserId, (db) => [
    db
      .select({
        id: prayerRequests.id,
        body: prayerRequests.body,
        status: prayerRequests.status,
        anonymous: prayerRequests.anonymous,
        createdAt: prayerRequests.createdAt,
        name: users.name,
      })
      .from(prayerRequests)
      .innerJoin(users, eq(users.id, prayerRequests.userId))
      .where(and(eq(prayerRequests.churchId, churchId), eq(prayerRequests.scope, "church")))
      .orderBy(desc(prayerRequests.createdAt))
      .limit(200),
  ]);
  return rows.map((r) => ({ ...r, name: r.anonymous ? null : r.name }));
}
