import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, uid } from "./setup";
import { eq, inArray } from "drizzle-orm";

describe.skipIf(!hasTestDb)("mantenimiento / retención (Postgres real)", () => {
  let db: typeof import("@/db");
  let s: typeof import("@/db/schema");
  let m: typeof import("@/server/platform/maintenance");
  const u = uid("ret");
  const ids = { old: uid("c-old"), recent: uid("c-recent"), active: uid("c-active") };

  beforeAll(async () => {
    db = await import("@/db");
    s = await import("@/db/schema");
    m = await import("@/server/platform/maintenance");
    await db.getDb().insert(s.users).values({ id: u, email: `${u}@t.local` });
    const day = 86_400_000;
    await db.withUserContext(u, (d) => [
      d.insert(s.conversations).values([
        { id: ids.old, userId: u, deletedAt: new Date(Date.now() - 31 * day) },
        { id: ids.recent, userId: u, deletedAt: new Date(Date.now() - 5 * day) },
        { id: ids.active, userId: u },
      ]),
      d.insert(s.messages).values({ conversationId: ids.old, role: "user", content: "viejo" }),
    ]);
  });

  it("sin modo mantenimiento, nadie puede borrar conversaciones ajenas", async () => {
    const r = await db.getDb().delete(s.conversations).where(eq(s.conversations.id, ids.old)).returning();
    expect(r).toHaveLength(0);
  });

  it("purga SOLO lo borrado hace más de 30 días (y sus mensajes)", async () => {
    const summary = await m.runMaintenance();
    expect(summary.conversationsPurged).toBeGreaterThanOrEqual(1);
    const [left, msgs] = await db.withUserContext(u, (d) => [
      d.select({ id: s.conversations.id }).from(s.conversations).where(inArray(s.conversations.id, Object.values(ids))),
      d.select().from(s.messages).where(eq(s.messages.conversationId, ids.old)),
    ]);
    expect(left.map((r) => r.id).sort()).toEqual([ids.active, ids.recent].sort());
    expect(msgs).toHaveLength(0);
  });

  it("el modo mantenimiento no permite leer ni borrar conversaciones activas", async () => {
    const [read, del] = await db.withMaintenanceContext((d) => [
      d.select().from(s.conversations).where(eq(s.conversations.id, ids.active)),
      d.delete(s.conversations).where(eq(s.conversations.id, ids.active)).returning(),
    ]);
    expect(read).toHaveLength(0);
    expect(del).toHaveLength(0);
  });
});
