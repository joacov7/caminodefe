/**
 * Límites de uso del asistente por plan. La lógica de decisión es pura y
 * testeable; el conteo real contra la DB se resuelve aparte.
 */

export const PLAN_DAILY_LIMITS: Record<string, number> = {
  free: 15,
  premium: 200,
};

export type LimitDecision = {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
};

export function checkDailyLimit(
  planId: string,
  usedToday: number,
): LimitDecision {
  const limit = PLAN_DAILY_LIMITS[planId] ?? PLAN_DAILY_LIMITS.free!;
  const remaining = Math.max(0, limit - usedToday);
  return { allowed: usedToday < limit, limit, used: usedToday, remaining };
}

/** Fecha en formato YYYY-MM-DD (UTC) para agrupar el uso diario. */
export function usageDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
