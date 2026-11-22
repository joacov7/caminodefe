import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, uid } from "./setup";

describe.skipIf(!hasTestDb)("plataforma sobre Postgres real", () => {
  let rl: typeof import("@/server/platform/rate-limit");
  let an: typeof import("@/server/platform/analytics");
  beforeAll(async () => {
    rl = await import("@/server/platform/rate-limit");
    an = await import("@/server/platform/analytics");
  });

  it("rate limit: bloquea al superar el límite y reinicia al pasar la ventana", async () => {
    const rule = { bucket: uid("b"), limit: 3, windowMs: 60_000 };
    const t0 = new Date("2026-01-01T00:00:00Z");
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rl.consumeRateLimit(rule, "u1", t0));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    const later = new Date(t0.getTime() + 61_000);
    expect((await rl.consumeRateLimit(rule, "u1", later)).allowed).toBe(true);
    // Otra identidad no se ve afectada.
    expect((await rl.consumeRateLimit(rule, "u2", t0)).allowed).toBe(true);
  });

  it("rate limit: atómico ante concurrencia", async () => {
    const rule = { bucket: uid("c"), limit: 10, windowMs: 60_000 };
    const now = new Date();
    const all = await Promise.all(Array.from({ length: 15 }, () => rl.consumeRateLimit(rule, "x", now)));
    expect(all.filter((r) => r.allowed)).toHaveLength(10);
  });

  it("analítica: solo contadores agregados", async () => {
    const day = new Date(Date.UTC(2030 + Math.floor(Math.random() * 500), 4, 5, 12));
    const dayStr = day.toISOString().slice(0, 10);
    await an.track("devotional_read", "Hola Juan!", day);
    await an.track("devotional_read", "Hola Juan!", day);
    const { getDb } = await import("@/db");
    const { analyticsDaily } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await getDb().select().from(analyticsDaily).where(eq(analyticsDaily.day, dayStr));
    expect(rows).toEqual([{ day: dayStr, event: "devotional_read", dim: "holajuan", count: 2 }]);
  });
});
