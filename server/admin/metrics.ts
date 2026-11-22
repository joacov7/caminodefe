/** Métricas AGREGADAS de plataforma para administración (sin datos personales). */
import "server-only";
import { desc, eq, gte, sql } from "drizzle-orm";
import { dbOrNull } from "@/db";
import { aiUsage, answerCache, answerLibrary, auditLog, churches, users } from "@/db/schema";
import { analyticsSummary } from "@/server/platform/analytics";

export async function platformMetrics() {
  const db = dbOrNull();
  if (!db) return null;
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [[u], churchRows, ai, [cache], [lib], events] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(users),
    db.select({ status: churches.status, n: sql<number>`count(*)::int` }).from(churches).groupBy(churches.status),
    db
      .select({
        kind: sql<string>`case when ${aiUsage.model} like 'cache:%' then ${aiUsage.model} else 'model' end`,
        n: sql<number>`count(*)::int`,
        cost: sql<number>`coalesce(sum(${aiUsage.costEstimate}),0)::int`,
        users: sql<number>`count(distinct ${aiUsage.userId})::int`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.day, since))
      .groupBy(sql`1`),
    db.select({ n: sql<number>`count(*)::int` }).from(answerCache).where(sql`${answerCache.invalidatedAt} is null`),
    db.select({ n: sql<number>`count(*)::int` }).from(answerLibrary).where(eq(answerLibrary.status, "published")),
    analyticsSummary(30),
  ]);
  const byStatus = Object.fromEntries(churchRows.map((r) => [r.status, r.n]));
  const totalAi = ai.reduce((a, r) => a + r.n, 0);
  const modelRow = ai.find((r) => r.kind === "model");
  const cached = ai.filter((r) => r.kind !== "model").reduce((a, r) => a + r.n, 0);
  const aiUsers = Math.max(1, modelRow?.users ?? 0);
  return {
    users: u?.n ?? 0,
    churches: { verified: byStatus.verified ?? 0, pending: byStatus.pending ?? 0 },
    ai: {
      answers: totalAi,
      cachedShare: totalAi ? cached / totalAi : 0,
      costUsd: (modelRow?.cost ?? 0) / 1_000_000,
      costPerActiveUserUsd: (modelRow?.cost ?? 0) / 1_000_000 / aiUsers,
    },
    cacheEntries: cache?.n ?? 0,
    libraryPublished: lib?.n ?? 0,
    events: events ?? [],
  };
}

export async function recentAudit(limit = 100) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      churchId: auditLog.churchId,
      createdAt: auditLog.createdAt,
      actorName: users.name,
      metadata: auditLog.metadata,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorUserId))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}

export async function listLibrary() {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select({
      id: answerLibrary.id,
      question: answerLibrary.question,
      answer: answerLibrary.answer,
      status: answerLibrary.status,
      hits: answerLibrary.hits,
      retiredAt: answerLibrary.retiredAt,
      createdAt: answerLibrary.createdAt,
      hasEmbedding: sql<boolean>`${answerLibrary.embedding} is not null`,
    })
    .from(answerLibrary)
    .orderBy(desc(answerLibrary.createdAt))
    .limit(300);
}
