import { describe, it, expect } from "vitest";
import {
  BIBLE_BOOKS,
  getBookBySlug,
  getBookByName,
  isValidChapter,
} from "@/lib/bible/books";
import { flattenBibleDataset } from "@/db/import-bible";

describe("metadatos bíblicos", () => {
  it("tiene los 66 libros del canon protestante", () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
    expect(BIBLE_BOOKS.filter((b) => b.testament === "AT")).toHaveLength(39);
    expect(BIBLE_BOOKS.filter((b) => b.testament === "NT")).toHaveLength(27);
  });

  it("resuelve libros por slug y por nombre", () => {
    expect(getBookBySlug("juan")?.name).toBe("Juan");
    expect(getBookBySlug("1-corintios")?.chapters).toBe(16);
    expect(getBookByName("Salmos")?.slug).toBe("salmos");
    expect(getBookBySlug("no-existe")).toBeUndefined();
  });

  it("valida el rango de capítulos", () => {
    const juan = getBookBySlug("juan")!;
    expect(isValidChapter(juan, 1)).toBe(true);
    expect(isValidChapter(juan, 21)).toBe(true);
    expect(isValidChapter(juan, 22)).toBe(false);
    expect(isValidChapter(juan, 0)).toBe(false);
    expect(isValidChapter(juan, 1.5)).toBe(false);
  });

  it("los slugs son únicos", () => {
    const slugs = new Set(BIBLE_BOOKS.map((b) => b.slug));
    expect(slugs.size).toBe(BIBLE_BOOKS.length);
  });
});

describe("importador de Biblia (flattenBibleDataset)", () => {
  it("aplana capítulos y versículos con numeración 1-based", () => {
    const rows = flattenBibleDataset(
      {
        books: [
          {
            name: "Juan",
            chapters: [["En el principio…"], ["Al tercer día…", "Y dijo…"]],
          },
        ],
      },
      "rvr1909",
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      versionId: "rvr1909",
      book: "Juan",
      chapter: 1,
      verse: 1,
      text: "En el principio…",
    });
    expect(rows[2]).toMatchObject({ chapter: 2, verse: 2, text: "Y dijo…" });
  });

  it("rechaza libros que no pertenecen al canon", () => {
    expect(() =>
      flattenBibleDataset(
        { books: [{ name: "Libro Inventado", chapters: [["x"]] }] },
        "rvr1909",
      ),
    ).toThrow(/desconocido/i);
  });
});
