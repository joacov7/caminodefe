/**
 * Rate limiting de ventana fija sobre Postgres (sin servicios externos).
 * El incremento es ATÓMICO (un único UPSERT), seguro ante solicitudes
 * concurrentes. Las claves se guardan como hash: nunca se almacena una IP o
 * un id de usuario en claro.
 */
import "server-only";
import { createHash } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import { dbOrNull } from "@/db";
import { rateLimits } from "@/db/schema";

export type RateLimitRule = { bucket: string; limit: number; windowMs: number };

/** Reglas por tipo de operación (ajustables). */
export const RATE_LIMITS = {
  assistant: { bucket: "assistant", limit: 12, windowMs: 60_000 },
  contact: { bucket: "contact", limit: 5, windowMs: 60 * 60_000 },
  write: { bucket: "write", limit: 60, windowMs: 60_000 },
  auth: { bucket: "auth", limit: 10, windowMs: 15 * 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: Date };

export function rateLimitKey(bucket: string, identity: string): string {
  return `${bucket}:${createHash("sha256").update(`${bucket}|${identity}`).digest("hex").slice(0, 32)}`;
}

/** Decisión pura dado el conteo resultante (para tests). */
export function decide(count: number, windowStart: Date, rule: RateLimitRule): RateLimitResult {
  return {
    allowed: count <= rule.limit,
    remaining: Math.max(0, rule.limit - count),
    resetAt: new Date(windowStart.getTime() + rule.windowMs),
  };
}

/**
 * Consume una unidad. Sin base configurada, permite (no hay dónde contar) —
 * el resto de los controles de autorización siguen aplicando.
 */
export async function consumeRateLimit(
  rule: RateLimitRule,
  identity: string,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const db = dbOrNull();
  if (!db) return { allowed: true, remaining: rule.limit, resetAt: now };
  const key = rateLimitKey(rule.bucket, identity);
  const threshold = new Date(now.getTime() - rule.windowMs);
  const rows = await db
    .insert(rateLimits)
    .values({ key, windowStart: now, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.windowStart} <= ${threshold} then 1 else ${rateLimits.count} + 1 end`,
        windowStart: sql`case when ${rateLimits.windowStart} <= ${threshold} then ${now} else ${rateLimits.windowStart} end`,
      },
    })
    .returning({ count: rateLimits.count, windowStart: rateLimits.windowStart });

  // Limpieza oportunista de ventanas viejas (~1 % de las solicitudes).
  if (Math.random() < 0.01) {
    const old = new Date(now.getTime() - 24 * 60 * 60_000);
    void db.delete(rateLimits).where(lt(rateLimits.windowStart, old)).catch(() => undefined);
  }
  const row = rows[0]!;
  return decide(row.count, new Date(row.windowStart), rule);
}

/** Identidad para limitar: el usuario si hay sesión; si no, la IP (hasheada). */
export function identityFrom(userId: string | null | undefined, headers: Headers): string {
  if (userId) return `u:${userId}`;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "anon";
  return `ip:${ip}`;
}
