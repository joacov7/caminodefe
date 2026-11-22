/**
 * Recuperación de contexto (RAG) — versión mínima del MVP.
 *
 * Estrategia inicial: recuperar los versículos bíblicos cuyas referencias
 * aparecen en la consulta del usuario (recuperación por referencia). Es exacta y
 * no requiere embeddings. La búsqueda semántica con pgvector sobre materiales
 * autorizados se agrega como iteración posterior (documentada en docs/03 §D.4).
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { bibleVerses } from "@/db/schema";
import { extractCitations } from "./citations";
import { DEFAULT_VERSION } from "@/lib/bible/queries";

export type RetrievedPassage = { ref: string; text: string };

/**
 * Recupera pasajes bíblicos referenciados en `query`. Inyectable para tests:
 * `fetchVerse` devuelve el texto de un versículo (o null si no existe).
 */
export async function retrieveByReference(
  query: string,
  fetchVerse: (
    book: string,
    chapter: number,
    verse: number,
  ) => Promise<string | null>,
): Promise<RetrievedPassage[]> {
  const citations = extractCitations(query).filter((c) => c.verseStart != null);
  const passages: RetrievedPassage[] = [];
  for (const c of citations) {
    const start = c.verseStart!;
    const end = c.verseEnd ?? start;
    for (let v = start; v <= end; v++) {
      const text = await fetchVerse(c.book.name, c.chapter, v);
      if (text) passages.push({ ref: `${c.book.name} ${c.chapter}:${v}`, text });
    }
  }
  return passages;
}

/** Formatea los pasajes como bloque de contexto para el prompt. */
export function formatContext(passages: RetrievedPassage[]): string | null {
  if (passages.length === 0) return null;
  return passages.map((p) => `${p.ref} — "${p.text}"`).join("\n");
}

/** Implementación real de `fetchVerse` sobre la DB (Neon). */
export function dbFetchVerse(versionId: string = DEFAULT_VERSION) {
  return async (
    book: string,
    chapter: number,
    verse: number,
  ): Promise<string | null> => {
    const rows = await getDb()
      .select({ text: bibleVerses.text })
      .from(bibleVerses)
      .where(
        and(
          eq(bibleVerses.versionId, versionId),
          eq(bibleVerses.book, book),
          eq(bibleVerses.chapter, chapter),
          eq(bibleVerses.verse, verse),
        ),
      )
      .limit(1);
    return rows[0]?.text ?? null;
  };
}

/**
 * Recuperación TEMÁTICA (sin referencia explícita): búsqueda de texto completo
 * en español sobre el corpus bíblico (índice GIN, migración 0010). Devuelve los
 * versículos más relevantes para que el modelo cite texto REAL y verificable.
 */
export function dbSearchVerses(versionId: string = DEFAULT_VERSION, limit = 6) {
  return async (query: string): Promise<RetrievedPassage[]> => {
    const terms = query.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
    if (terms.length < 3) return [];
    const tsv = sql`to_tsvector('spanish', ${bibleVerses.text})`;
    const tsq = sql`plainto_tsquery('spanish', ${terms})`;
    // plainto_tsquery exige TODOS los términos; si no hay resultados se
    // relaja a "cualquiera" (OR) para preguntas en lenguaje natural.
    const anyTsq = sql`to_tsquery('spanish', array_to_string(tsvector_to_array(to_tsvector('spanish', ${terms})), ' | '))`;
    const run = (q: typeof tsq) =>
      getDb()
        .select({
          book: bibleVerses.book,
          chapter: bibleVerses.chapter,
          verse: bibleVerses.verse,
          text: bibleVerses.text,
        })
        .from(bibleVerses)
        .where(and(eq(bibleVerses.versionId, versionId), sql`${tsv} @@ ${q}`))
        .orderBy(desc(sql`ts_rank(${tsv}, ${q})`))
        .limit(limit);
    let rows = await run(tsq);
    if (rows.length === 0) rows = await run(anyTsq);
    return rows.map((r) => ({ ref: `${r.book} ${r.chapter}:${r.verse}`, text: r.text }));
  };
}

/**
 * Combina ambas estrategias: primero los pasajes citados explícitamente; si no
 * hay, búsqueda temática. Sin duplicados.
 */
export async function retrieveCombined(
  query: string,
  byReference: (q: string) => Promise<RetrievedPassage[]>,
  byTopic: (q: string) => Promise<RetrievedPassage[]>,
): Promise<RetrievedPassage[]> {
  const explicit = await byReference(query);
  if (explicit.length > 0) return explicit;
  const topical = await byTopic(query).catch(() => []);
  const seen = new Set<string>();
  return topical.filter((p) => (seen.has(p.ref) ? false : (seen.add(p.ref), true)));
}
