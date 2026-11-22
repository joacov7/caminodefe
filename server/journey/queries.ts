/**
 * Consultas del progreso PRIVADO (camino, planes, recordatorios). Siempre con
 * `withUserContext` (RLS forzada). Sin base configurada: valores vacíos.
 */
import "server-only";
import { and, eq } from "drizzle-orm";
import { dbOrNull, withUserContext } from "@/db";
import { guidedPathProgress, readingPlanDays, reminderPrefs } from "@/db/schema";

export async function getGuidedProgress(userId: string) {
  if (!dbOrNull()) return [];
  const [rows] = await withUserContext(userId, (db) => [
    db
      .select({
        stageId: guidedPathProgress.stageId,
        completedAt: guidedPathProgress.completedAt,
        reflection: guidedPathProgress.reflection,
      })
      .from(guidedPathProgress)
      .where(eq(guidedPathProgress.userId, userId)),
  ]);
  return rows;
}

/** Días completados por plan: { planId: number[] } */
export async function getPlanProgress(userId: string): Promise<Record<string, number[]>> {
  if (!dbOrNull()) return {};
  const [rows] = await withUserContext(userId, (db) => [
    db
      .select({ planId: readingPlanDays.planId, day: readingPlanDays.day })
      .from(readingPlanDays)
      .where(eq(readingPlanDays.userId, userId)),
  ]);
  const out: Record<string, number[]> = {};
  for (const r of rows) (out[r.planId] ??= []).push(r.day);
  return out;
}

export async function getPlanDays(userId: string, planId: string): Promise<number[]> {
  if (!dbOrNull()) return [];
  const [rows] = await withUserContext(userId, (db) => [
    db
      .select({ day: readingPlanDays.day })
      .from(readingPlanDays)
      .where(and(eq(readingPlanDays.userId, userId), eq(readingPlanDays.planId, planId))),
  ]);
  return rows.map((r) => r.day);
}

export async function getReminderPrefs(userId: string) {
  if (!dbOrNull()) return null;
  const [rows] = await withUserContext(userId, (db) => [
    db.select().from(reminderPrefs).where(eq(reminderPrefs.userId, userId)).limit(1),
  ]);
  return rows[0] ?? null;
}
