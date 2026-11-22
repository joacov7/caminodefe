/**
 * Descarga la Reina-Valera 1909 (DOMINIO PÚBLICO) desde eBible.org y genera
 * `content/bible/rvr1909.json` en el formato que espera `db/import-bible.ts`.
 *
 * Fuente verificada (22/11/2026): https://ebible.org/find/details.php?id=spaRV1909
 * — "Santa Biblia — Reina Valera 1909 · Public Domain / Dominio Público".
 * El archivo resultante NO se versiona (ver .gitignore).
 *
 * Uso: `npm run db:fetch-bible` y luego `npm run db:import-bible`.
 */
import { inflateRawSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { BIBLE_BOOKS } from "../lib/bible/books";
import type { BibleDataset } from "./import-bible";

export const SOURCE_URL = "https://ebible.org/Scriptures/spaRV1909_vpl.zip";

/** Códigos de libro de eBible (VPL) en orden canónico protestante (66). */
export const VPL_CODES = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI",
  "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC", "SOL",
  "ISA", "JER", "LAM", "EZE", "DAN", "HOS", "JOE", "AMO", "OBA", "JON", "MIC",
  "NAH", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT", "MAR", "LUK", "JOH", "ACT",
  "ROM", "1CO", "2CO", "GAL", "EPH", "PHI", "COL", "1TH", "2TH", "1TI", "2TI",
  "TIT", "PHM", "HEB", "JAM", "1PE", "2PE", "1JO", "2JO", "3JO", "JUD", "REV",
] as const;

const LINE_RE = /^([1-3]?[A-Z]{2,3})\s+(\d+):(\d+)(?:\s+(.*))?$/;

/**
 * Convierte texto VPL ("JOH 3:16 Porque de tal manera…") al dataset por libro.
 * PURA y testeable. Valida libros conocidos, numeración contigua y la cantidad
 * de capítulos contra el canon (`lib/bible/books.ts`).
 */
export function parseVpl(text: string): BibleDataset {
  const byCode = new Map<string, string[][]>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = LINE_RE.exec(line);
    if (!m) throw new Error(`Línea VPL inválida: "${line.slice(0, 40)}"`);
    const [, code, ch, vs, body] = m;
    if (!(VPL_CODES as readonly string[]).includes(code!)) {
      throw new Error(`Código de libro desconocido: ${code}`);
    }
    const chapters = byCode.get(code!) ?? [];
    const chapter = Number(ch);
    const verse = Number(vs);
    while (chapters.length < chapter) chapters.push([]);
    const verses = chapters[chapter - 1]!;
    if (verse !== verses.length + 1) {
      throw new Error(`Numeración no contigua en ${code} ${chapter}:${verse}`);
    }
    // Algunos versículos vienen vacíos por diferencias de versificación (p. ej.
    // Números 12:16 está incluido en 13:1 en la RV1909): se conserva la posición.
    verses.push((body ?? "").trim());
    byCode.set(code!, chapters);
  }

  const books = VPL_CODES.map((code, i) => {
    const meta = BIBLE_BOOKS[i]!;
    const chapters = byCode.get(code);
    if (!chapters) throw new Error(`Falta el libro ${code} (${meta.name})`);
    if (chapters.length !== meta.chapters) {
      throw new Error(
        `${meta.name}: ${chapters.length} capítulos, se esperaban ${meta.chapters}`,
      );
    }
    return { name: meta.name, chapters };
  });
  return { books };
}

/** Extrae un archivo de un ZIP (método store o deflate). Sin dependencias. */
export function extractFromZip(zip: Buffer, suffix: string): Buffer {
  // Ubicar el "End of Central Directory".
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("ZIP inválido (sin directorio central).");
  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error("ZIP corrupto.");
    const method = zip.readUInt16LE(p + 10);
    const compSize = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const localOffset = zip.readUInt32LE(p + 42);
    const name = zip.toString("utf8", p + 46, p + 46 + nameLen);
    if (name.endsWith(suffix)) {
      const lNameLen = zip.readUInt16LE(localOffset + 26);
      const lExtraLen = zip.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + lNameLen + lExtraLen;
      const data = zip.subarray(start, start + compSize);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRawSync(data);
      throw new Error(`Método de compresión no soportado: ${method}`);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`No se encontró *${suffix} en el ZIP.`);
}

async function main() {
  console.log(`Descargando ${SOURCE_URL} …`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Descarga fallida: HTTP ${res.status}`);
  const zip = Buffer.from(await res.arrayBuffer());
  const txt = extractFromZip(zip, "_vpl.txt").toString("utf8");
  const dataset = parseVpl(txt);
  const total = dataset.books.reduce(
    (n, b) => n + b.chapters.reduce((m, c) => m + c.length, 0),
    0,
  );
  await mkdir("content/bible", { recursive: true });
  await writeFile("content/bible/rvr1909.json", JSON.stringify(dataset));
  console.log(`OK: 66 libros, ${total} versículos → content/bible/rvr1909.json`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Error al obtener la Biblia:", err);
    process.exit(1);
  });
}
