/**
 * Importador del texto bíblico RVR1909 (dominio público) a la tabla
 * `bible_verses`.
 *
 * Espera un archivo JSON en `content/bible/rvr1909.json` con la forma:
 *   { "books": [ { "name": "Juan", "chapters": [ ["v1","v2",...], ... ] } ] }
 *
 * El nombre de cada libro debe coincidir con `BibleBook.name` (ver
 * lib/bible/books.ts). Ese dataset NO se versiona en el repo (es grande); se
 * obtiene de una fuente de dominio público. Este script es idempotente.
 *
 * Uso: `npx tsx db/import-bible.ts` (requiere DATABASE_URL).
 */
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { requireEnv } from "../lib/env";
import { bibleVerses, bibleVersions } from "./schema";
import { getBookByName } from "../lib/bible/books";

export type BibleDataset = {
  books: { name: string; chapters: string[][] }[];
};

export type VerseRow = {
  versionId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

/**
 * Transforma el dataset en filas planas para insertar. Función PURA (testeable).
 * Valida que cada libro exista en el canon; lanza si encuentra uno desconocido.
 */
export function flattenBibleDataset(
  dataset: BibleDataset,
  versionId: string,
): VerseRow[] {
  const rows: VerseRow[] = [];
  for (const book of dataset.books) {
    const known = getBookByName(book.name);
    if (!known) {
      throw new Error(`Libro desconocido en el dataset: "${book.name}"`);
    }
    book.chapters.forEach((verses, chapterIdx) => {
      verses.forEach((text, verseIdx) => {
        rows.push({
          versionId,
          book: known.name,
          chapter: chapterIdx + 1,
          verse: verseIdx + 1,
          text: text.trim(),
        });
      });
    });
  }
  return rows;
}

async function main() {
  const versionId = "rvr1909";
  const raw = await readFile("content/bible/rvr1909.json", "utf8");
  const dataset = JSON.parse(raw) as BibleDataset;
  const rows = flattenBibleDataset(dataset, versionId);

  const db = drizzle(neon(requireEnv("DATABASE_URL")), {
    schema: { bibleVerses, bibleVersions },
  });

  await db
    .insert(bibleVersions)
    .values({
      id: versionId,
      name: "Reina-Valera 1909",
      language: "es",
      license: "Dominio público",
      isPublicDomain: true,
    })
    .onConflictDoNothing();

  // Inserción por lotes para no exceder límites de parámetros.
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    await db
      .insert(bibleVerses)
      .values(rows.slice(i, i + batchSize))
      .onConflictDoNothing();
  }

  console.log(`Importados ${rows.length} versículos de ${versionId}.`);
}

// Ejecutar solo si se invoca directamente (no al importar en tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Error al importar la Biblia:", err);
    process.exit(1);
  });
}
