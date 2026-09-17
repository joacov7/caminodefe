/**
 * Límites de uso del asistente por plan. La lógica de decisión es pura y
 * testeable; el conteo real contra la DB se resuelve aparte. El límite por plan
 * proviene del catálogo único (server/billing/plans).
 */
import { planDailyLimit } from "@/server/billing/plans";

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
  const limit = planDailyLimit(planId);
  const remaining = Math.max(0, limit - usedToday);
  return { allowed: usedToday < limit, limit, used: usedToday, remaining };
}

/** Fecha en formato YYYY-MM-DD (UTC) para agrupar el uso diario. */
export function usageDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
