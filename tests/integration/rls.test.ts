import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, uid } from "./setup";
import { eq, sql } from "drizzle-orm";

/**
 * Verifica la defensa en profundidad: con FORCE ROW LEVEL SECURITY, los datos
 * privados solo son visibles/escribibles con el contexto del dueño.
 */
describe.skipIf(!hasTestDb)("RLS de datos privados (Postgres real)", () => {
  let db: typeof import("@/db");
  let schema: typeof import("@/db/schema");
  let conv: typeof import("@/server/ai/conversations");
  const alice = uid("alice");
  const bob = uid("bob");

  beforeAll(async () => {
    db = await import("@/db");
    schema = await import("@/db/schema");
    conv = await import("@/server/ai/conversations");
    await db.getDb().insert(schema.users).values([
      { id: alice, email: `${alice}@test.local` },
      { id: bob, email: `${bob}@test.local` },
    ]);
  });

  it("el rol de prueba no es superusuario (si no, la RLS no aplicaría)", async () => {
    const r = await db.getDb().execute(sql`select rolsuper from pg_roles where rolname = current_user`);
    expect((r as unknown as { rows: { rolsuper: boolean }[] }).rows[0]!.rolsuper).toBe(false);
  });

  it("una nota solo la ve su dueño; sin contexto no se ve nada", async () => {
    await db.withUserContext(alice, (d) => [
      d.insert(schema.userNotes).values({ userId: alice, body: "privada" }),
    ]);
    const [mine] = await db.withUserContext(alice, (d) => [
      d.select().from(schema.userNotes).where(eq(schema.userNotes.userId, alice)),
    ]);
    const [asBob] = await db.withUserContext(bob, (d) => [
      d.select().from(schema.userNotes).where(eq(schema.userNotes.userId, alice)),
    ]);
    const noContext = await db
      .getDb()
      .select()
      .from(schema.userNotes)
      .where(eq(schema.userNotes.userId, alice));
    expect(mine).toHaveLength(1);
    expect(asBob).toHaveLength(0);
    expect(noContext).toHaveLength(0);
  });

  it("no se puede escribir una fila a nombre de otro usuario", async () => {
    await expect(
      db.withUserContext(bob, (d) => [
        d.insert(schema.userJournal).values({ userId: alice, entry: "suplantación" }),
      ]),
    ).rejects.toThrow();
  });

  it("el historial del asistente es privado de punta a punta", async () => {
    const id = await conv.persistTurn({
      userId: alice,
      userText: "¿Qué dice Juan 3:16?",
      assistantText: "Juan 3:16 habla del amor de Dios.",
      citations: [],
    });
    expect((await conv.listConversations(alice)).map((c) => c.id)).toContain(id);
    expect(await conv.listConversations(bob)).toHaveLength(0);
    expect(await conv.getConversationWithMessages(bob, id)).toBeNull();
    const full = await conv.getConversationWithMessages(alice, id);
    expect(full?.messages.map((m) => m.role)).toEqual(["user", "assistant"]);

    // Bob no puede "secuestrar" la conversación de Alice pasando su id.
    const bobConv = await conv.persistTurn({
      userId: bob,
      conversationId: id,
      userText: "hola",
      assistantText: "hola",
      citations: [],
    });
    expect(bobConv).not.toBe(id);
    expect((await conv.getConversationWithMessages(alice, id))?.messages).toHaveLength(2);
  });

  it("borrar la cuenta elimina en cascada los datos privados", async () => {
    const carol = uid("carol");
    await db.getDb().insert(schema.users).values({ id: carol, email: `${carol}@t.local` });
    await db.withUserContext(carol, (d) => [
      d.insert(schema.userNotes).values({ userId: carol, body: "x" }),
    ]);
    await db.getDb().delete(schema.users).where(eq(schema.users.id, carol));
    const [left] = await db.withUserContext(carol, (d) => [
      d.select().from(schema.userNotes).where(eq(schema.userNotes.userId, carol)),
    ]);
    expect(left).toHaveLength(0);
  });
});
