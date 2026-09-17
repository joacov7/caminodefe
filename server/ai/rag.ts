/**
 * Recuperación de contexto (RAG) — versión mínima del MVP.
 *
 * Estrategia inicial: recuperar los versículos bíblicos cuyas referencias
 * aparecen en la consulta del usuario (recuperación por referencia). Es exacta y
 * no requiere embeddings. La búsqueda semántica con pgvector sobre materiales
 * autorizados se agrega como iteración posterior (documentada en docs/03 §D.4).
 */
import { and, eq } from "drizzle-orm";
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
