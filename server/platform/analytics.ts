/**
 * Analítica respetuosa de la privacidad: SOLO contadores agregados por día.
 * Sin userId, sin IP, sin cookies, sin huellas del dispositivo. No identifica
 * personas, por lo que no requiere banner de consentimiento. Nunca falla la
 * operación principal (errores silenciados).
 */
import "server-only";
import { and, gte, sql } from "drizzle-orm";
import { dbOrNull } from "@/db";
import { analyticsDaily } from "@/db/schema";

/** Catálogo cerrado de eventos (evita registrar texto libre). */
export const ANALYTICS_EVENTS = [
  "bible_chapter_read",
  "devotional_read",
  "assistant_answer",
  "guided_stage_completed",
  "reading_day_completed",
  "plan_started",
  "church_profile_view",
  "contact_request_sent",
  "event_view",
  "event_calendar_added",
  "signup",
  "prayer_request_created",
  "church_invite_opened",
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/** Dimensión permitida: valores cortos y no personales (p. ej. "model", "cache"). */
export function sanitizeDim(dim: string | undefined): string {
  if (!dim) return "";
  return dim.toLowerCase().replace(/[^a-z0-9_:-]/g, "").slice(0, 40);
}

export async function track(event: AnalyticsEvent, dim?: string, now = new Date()) {
  const db = dbOrNull();
  if (!db) return;
  try {
    await db
      .insert(analyticsDaily)
      .values({ day: now.toISOString().slice(0, 10), event, dim: sanitizeDim(dim), count: 1 })
      .onConflictDoUpdate({
        target: [analyticsDaily.day, analyticsDaily.event, analyticsDaily.dim],
        set: { count: sql`${analyticsDaily.count} + 1` },
      });
  } catch {
    // La analítica nunca rompe la experiencia.
  }
}

/** Totales por evento en los últimos `days` días (panel de administración). */
export async function analyticsSummary(days = 30) {
  const db = dbOrNull();
  if (!db) return null;
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  return db
    .select({
      event: analyticsDaily.event,
      dim: analyticsDaily.dim,
      total: sql<number>`sum(${analyticsDaily.count})::int`,
    })
    .from(analyticsDaily)
    .where(and(gte(analyticsDaily.day, since)))
    .groupBy(analyticsDaily.event, analyticsDaily.dim)
    .orderBy(analyticsDaily.event);
}

/** Serie diaria de un evento (para gráficos). */
export async function analyticsSeries(event: AnalyticsEvent, days = 30) {
  const db = dbOrNull();
  if (!db) return null;
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  return db
    .select({ day: analyticsDaily.day, total: sql<number>`sum(${analyticsDaily.count})::int` })
    .from(analyticsDaily)
    .where(and(gte(analyticsDaily.day, since), sql`${analyticsDaily.event} = ${event}`))
    .groupBy(analyticsDaily.day)
    .orderBy(analyticsDaily.day);
}
