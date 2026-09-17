/**
 * Extracción y verificación de citas bíblicas en el texto del asistente.
 *
 * Regla no negociable: no se afirma que una respuesta tiene "respaldo bíblico"
 * si la referencia no se pudo verificar contra el corpus (tabla bible_verses).
 */
import { BIBLE_BOOKS, getBookByName, type BibleBook } from "@/lib/bible/books";

export type Citation = {
  raw: string;
  book: BibleBook;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
};

// Alternación de nombres de libro (más largos primero para no cortar "1 Juan").
const BOOK_NAMES = [...BIBLE_BOOKS]
  .map((b) => b.name)
  .sort((a, b) => b.length - a.length)
  .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

const CITATION_RE = new RegExp(
  `\\b(${BOOK_NAMES.join("|")})\\s+(\\d{1,3})(?::(\\d{1,3})(?:\\s*[-–]\\s*(\\d{1,3}))?)?`,
  "gi",
);

/** Extrae todas las referencias bíblicas mencionadas en el texto. */
export function extractCitations(text: string): Citation[] {
  const out: Citation[] = [];
  for (const m of text.matchAll(CITATION_RE)) {
    const book = getBookByName(m[1]!);
    if (!book) continue;
    const chapter = Number(m[2]);
    const verseStart = m[3] ? Number(m[3]) : undefined;
    const verseEnd = m[4] ? Number(m[4]) : undefined;
    out.push({ raw: m[0], book, chapter, verseStart, verseEnd });
  }
  return out;
}

export type CitationCheck = Citation & { verified: boolean };

/**
 * Verifica cada cita. `exists` consulta el corpus: dado (libro, capítulo, verso)
 * devuelve si ese versículo existe. Se inyecta para poder testear sin DB.
 * Si la cita no trae verso, se valida solo que el capítulo esté en rango.
 */
export async function verifyCitations(
  citations: Citation[],
  exists: (book: BibleBook, chapter: number, verse: number) => Promise<boolean>,
): Promise<CitationCheck[]> {
  return Promise.all(
    citations.map(async (c) => {
      const chapterInRange = c.chapter >= 1 && c.chapter <= c.book.chapters;
      if (!chapterInRange) return { ...c, verified: false };
      if (c.verseStart == null) return { ...c, verified: true };
      const verified = await exists(c.book, c.chapter, c.verseStart);
      return { ...c, verified };
    }),
  );
}
