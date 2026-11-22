import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, uid } from "./setup";

describe.skipIf(!hasTestDb)("asistente sobre Postgres real", () => {
  let rag: typeof import("@/server/ai/rag");
  let cache: typeof import("@/server/ai/cache");
  let db: typeof import("@/db");
  let schema: typeof import("@/db/schema");
  const version = uid("ver");

  beforeAll(async () => {
    db = await import("@/db");
    schema = await import("@/db/schema");
    rag = await import("@/server/ai/rag");
    cache = await import("@/server/ai/cache");
    await db.getDb().insert(schema.bibleVersions).values({ id: version, name: "t", license: "t" });
    await db.getDb().insert(schema.bibleVerses).values([
      { versionId: version, book: "Mateo", chapter: 6, verse: 34, text: "Así que, no os congojéis por el día de mañana; que el día de mañana traerá su fatiga" },
      { versionId: version, book: "Filipenses", chapter: 4, verse: 6, text: "Por nada estéis afanosos; sino sean notorias vuestras peticiones delante de Dios en toda oración y ruego" },
      { versionId: version, book: "Génesis", chapter: 1, verse: 1, text: "EN el principio crió Dios los cielos y la tierra." },
    ]);
  });

  it("búsqueda temática devuelve versículos reales relevantes", async () => {
    const res = await rag.dbSearchVerses(version)("¿Qué hago con el afán y la oración?");
    expect(res.map((r) => r.ref)).toContain("Filipenses 4:6");
    expect(res.map((r) => r.ref)).not.toContain("Génesis 1:1");
  });

  it("caché: guarda, encuentra por coincidencia exacta y por similitud, e invalida", async () => {
    const q = uid("que es la gracia de dios segun la biblia");
    await cache.storeCachedAnswer({ normalized: q, embedding: [1, 0, 0], answer: "La gracia es…", model: "m" });
    const exact = await cache.findCachedAnswer(q, async () => null);
    expect(exact?.source).toBe("cache");

    // Pregunta parecida en texto (trigramas) y casi idéntica en significado.
    const similar = await cache.findCachedAnswer(q + " hoy", async () => [0.99, 0.05, 0]);
    expect(similar?.source).toBe("cache");
    // Parecida en texto pero distinta en significado → no se reutiliza.
    const different = await cache.findCachedAnswer(q + " hoy", async () => [0, 1, 0]);
    expect(different).toBeNull();

    expect(await cache.invalidateAnswerCache()).toBeGreaterThan(0);
    expect(await cache.findCachedAnswer(q, async () => null)).toBeNull();
  });

  it("biblioteca curada: solo se sirve lo publicado", async () => {
    const q = uid("como orar segun jesus");
    const [row] = await db.getDb().insert(schema.answerLibrary).values({
      question: q, normalizedQuestion: q, answer: "Jesús enseñó el Padre Nuestro (Mateo 6:9-13)…", status: "review",
    }).returning({ id: schema.answerLibrary.id });
    expect(await cache.findCachedAnswer(q, async () => null)).toBeNull();
    const { eq } = await import("drizzle-orm");
    await db.getDb().update(schema.answerLibrary).set({ status: "published" }).where(eq(schema.answerLibrary.id, row!.id));
    expect((await cache.findCachedAnswer(q, async () => null))?.source).toBe("library");
  });
});
