import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, uid } from "./setup";
import { eq } from "drizzle-orm";

/**
 * Pedidos de oración: la RLS decide quién ve qué, incluido el acceso
 * COMPARTIDO con el equipo pastoral, y un trigger impide que el pastor altere
 * el pedido.
 */
describe.skipIf(!hasTestDb)("pedidos de oración (Postgres real)", () => {
  let db: typeof import("@/db");
  let s: typeof import("@/db/schema");
  let q: typeof import("@/server/prayer/queries");
  const persona = uid("persona");
  const pastorA = uid("pastorA");
  const pastorB = uid("pastorB");
  const vecino = uid("vecino");
  const churchA = uid("igA");
  const churchB = uid("igB");
  let sharedId = "";
  let privateId = "";
  let anonId = "";

  beforeAll(async () => {
    db = await import("@/db");
    s = await import("@/db/schema");
    q = await import("@/server/prayer/queries");
    const d = db.getDb();
    await d.insert(s.users).values([persona, pastorA, pastorB, vecino].map((id) => ({ id, email: `${id}@t.local`, name: id })));
    await d.insert(s.churches).values([
      { id: churchA, slug: churchA, name: "A", status: "verified" },
      { id: churchB, slug: churchB, name: "B", status: "verified" },
    ]);
    await d.insert(s.userRoles).values([
      { userId: pastorA, role: "pastor", scope: "church", churchId: churchA },
      { userId: pastorB, role: "pastor", scope: "church", churchId: churchB },
    ]);
    const ins = (values: Record<string, unknown>) =>
      db.withUserContext(persona, (x) => [x.insert(s.prayerRequests).values(values as never).returning({ id: s.prayerRequests.id })]);
    const idOf = async (values: Record<string, unknown>) => (await ins(values))[0][0]!.id;
    privateId = await idOf({ userId: persona, scope: "private", body: "Pedido íntimo" });
    sharedId = await idOf({ userId: persona, scope: "church", churchId: churchA, body: "Por mi familia" });
    anonId = await idOf({ userId: persona, scope: "church", churchId: churchA, anonymous: true, body: "Sin nombre" });
  });

  it("la persona ve todos sus pedidos", async () => {
    expect((await q.listMyPrayers(persona)).map((p) => p.id).sort()).toEqual([privateId, sharedId, anonId].sort());
  });

  it("el pastor de ESA iglesia ve solo lo compartido; el anónimo sin nombre", async () => {
    const rows = await q.listChurchPrayers(pastorA, churchA);
    expect(rows.map((r) => r.id).sort()).toEqual([sharedId, anonId].sort());
    expect(rows.find((r) => r.id === anonId)?.name).toBeNull();
    expect(rows.find((r) => r.id === sharedId)?.name).toBe(persona);
    // El pedido privado no es visible ni consultándolo por id.
    const [direct] = await db.withUserContext(pastorA, (x) => [
      x.select().from(s.prayerRequests).where(eq(s.prayerRequests.id, privateId)),
    ]);
    expect(direct).toHaveLength(0);
  });

  it("el pastor de OTRA iglesia y otros miembros no ven nada", async () => {
    expect(await q.listChurchPrayers(pastorB, churchA)).toHaveLength(0);
    const [asVecino] = await db.withUserContext(vecino, (x) => [x.select().from(s.prayerRequests)]);
    expect(asVecino.filter((r) => r.userId === persona)).toHaveLength(0);
  });

  it("el pastor puede marcar 'orando' pero NO cambiar el texto ni el anonimato", async () => {
    await db.withUserContext(pastorA, (x) => [
      x.update(s.prayerRequests).set({ status: "praying" }).where(eq(s.prayerRequests.id, sharedId)),
    ]);
    expect((await q.listMyPrayers(persona)).find((p) => p.id === sharedId)?.status).toBe("praying");
    await expect(
      db.withUserContext(pastorA, (x) => [
        x.update(s.prayerRequests).set({ body: "alterado" }).where(eq(s.prayerRequests.id, sharedId)),
      ]),
    ).rejects.toThrow();
    await expect(
      db.withUserContext(pastorA, (x) => [
        x.update(s.prayerRequests).set({ anonymous: false }).where(eq(s.prayerRequests.id, anonId)),
      ]),
    ).rejects.toThrow();
    await expect(
      db.withUserContext(pastorA, (x) => [
        x.update(s.prayerRequests).set({ status: "answered" }).where(eq(s.prayerRequests.id, sharedId)),
      ]),
    ).rejects.toThrow();
  });

  it("si la iglesia es suspendida, su equipo pierde el acceso", async () => {
    await db.getDb().update(s.churches).set({ status: "suspended" }).where(eq(s.churches.id, churchA));
    expect(await q.listChurchPrayers(pastorA, churchA)).toHaveLength(0);
    await db.getDb().update(s.churches).set({ status: "verified" }).where(eq(s.churches.id, churchA));
  });
});
