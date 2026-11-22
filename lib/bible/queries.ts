/**
 * Consultas de Biblia (server-side). El texto de los versículos vive en la DB.
 * Si la base no está configurada/seedeada, se devuelve un estado explícito en
 * lugar de fallar, para que la UI muestre un mensaje claro (sin "falsos verdes").
 */
import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { bibleVerses } from "@/db/schema";
import { type BibleBook } from "./books";

export const DEFAULT_VERSION = "rvr1909";

export type Verse = { verse: number; text: string };

export type ChapterResult =
  | { ok: true; verses: Verse[] }
  | { ok: false; reason: "not_configured" | "empty" | "error"; message: string };

export async function getChapterVerses(
  book: BibleBook,
  chapter: number,
  versionId: string = DEFAULT_VERSION,
): Promise<ChapterResult> {
  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "La base de datos no está configurada (falta DATABASE_URL). " +
        "Ejecutá las migraciones y el import de RVR1909 para leer el texto.",
    };
  }

  try {
    const rows = await db
      .select({ verse: bibleVerses.verse, text: bibleVerses.text })
      .from(bibleVerses)
      .where(
        and(
          eq(bibleVerses.versionId, versionId),
          eq(bibleVerses.book, book.name),
          eq(bibleVerses.chapter, chapter),
        ),
      )
      .orderBy(asc(bibleVerses.verse));

    if (rows.length === 0) {
      return {
        ok: false,
        reason: "empty",
        message:
          "Este capítulo aún no está cargado. Importá el texto de RVR1909 " +
          "(npm run db:seed / importador) para verlo.",
      };
    }
    return { ok: true, verses: rows };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Error al leer la Biblia.",
    };
  }
}

export type PassageText = { ref: string; verses: Verse[] };

/**
 * Texto de un pasaje (libro, capítulo, rango opcional) desde la DB. Devuelve
 * `null` si la base no está configurada o el pasaje no está cargado.
 */
export async function getPassage(
  bookName: string,
  chapter: number,
  from?: number,
  to?: number,
  versionId: string = DEFAULT_VERSION,
): Promise<PassageText | null> {
  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    return null;
  }
  try {
    const rows = await db
      .select({ verse: bibleVerses.verse, text: bibleVerses.text })
      .from(bibleVerses)
      .where(
        and(
          eq(bibleVerses.versionId, versionId),
          eq(bibleVerses.book, bookName),
          eq(bibleVerses.chapter, chapter),
          ...(from != null ? [gte(bibleVerses.verse, from)] : []),
          ...(from != null ? [lte(bibleVerses.verse, to ?? from)] : []),
        ),
      )
      .orderBy(asc(bibleVerses.verse));
    if (rows.length === 0) return null;
    const ref =
      from == null ? `${bookName} ${chapter}` : `${bookName} ${chapter}:${from}${to ? `-${to}` : ""}`;
    return { ref, verses: rows };
  } catch {
    return null;
  }
}
