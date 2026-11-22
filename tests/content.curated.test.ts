import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { GUIDED_PATH } from "@/content/guided-path";
import { READING_PLANS } from "@/content/reading-plans";
import { getBookByName } from "@/lib/bible/books";

type Ref = { book: string; chapter: number; from?: number; to?: number };

// Si el texto RVR1909 está descargado (npm run db:fetch-bible), se verifica
// además que CADA versículo citado exista con texto. En CI sin dataset, se
// valida al menos libro y capítulo contra el canon.
const DATASET = "content/bible/rvr1909.json";
const bible: { books: { name: string; chapters: string[][] }[] } | null = existsSync(DATASET)
  ? JSON.parse(readFileSync(DATASET, "utf8"))
  : null;

function checkRef(r: Ref) {
  const book = getBookByName(r.book);
  expect(book, `libro desconocido: ${r.book}`).toBeDefined();
  expect(r.chapter).toBeGreaterThanOrEqual(1);
  expect(r.chapter).toBeLessThanOrEqual(book!.chapters);
  if (r.to != null) expect(r.to).toBeGreaterThan(r.from!);
  if (bible) {
    const verses = bible.books.find((b) => b.name === book!.name)!.chapters[r.chapter - 1]!;
    const last = r.to ?? r.from ?? verses.length;
    expect(last, `${r.book} ${r.chapter}:${last} no existe`).toBeLessThanOrEqual(verses.length);
    for (let v = r.from ?? 1; v <= last; v++) {
      expect(verses[v - 1]?.trim(), `${r.book} ${r.chapter}:${v} vacío`).toBeTruthy();
    }
  }
}

describe("contenido curado", () => {
  it("camino guiado: 10 etapas numeradas, ids únicos y estructura completa", () => {
    expect(GUIDED_PATH).toHaveLength(10);
    expect(GUIDED_PATH.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new Set(GUIDED_PATH.map((s) => s.id)).size).toBe(10);
    for (const s of GUIDED_PATH) {
      expect(s.passages.length).toBeGreaterThan(0);
      expect(s.explanation.length).toBeGreaterThan(0);
      expect(s.reflection.length).toBeGreaterThan(0);
      expect(s.practice).toBeTruthy();
      s.passages.forEach(checkRef);
    }
  });

  it("sin lenguaje de puntajes ni competencia espiritual", () => {
    const all = JSON.stringify([GUIDED_PATH, READING_PLANS]).toLowerCase();
    for (const banned of ["puntos", "ranking", "nivel espiritual", "medalla", "racha"]) {
      expect(all).not.toContain(banned);
    }
  });

  it("planes de lectura: días consecutivos y referencias válidas", () => {
    expect(READING_PLANS.some((p) => p.days === 7)).toBe(true);
    expect(READING_PLANS.some((p) => p.days === 30)).toBe(true);
    for (const p of READING_PLANS) {
      expect(p.schedule.map((d) => d.day)).toEqual(Array.from({ length: p.days }, (_, i) => i + 1));
      p.schedule.forEach((d) => d.readings.forEach(checkRef));
    }
  });

  it.runIf(bible)("verificado contra el texto real de la RVR1909", () => {
    expect(bible!.books).toHaveLength(66);
  });
});
