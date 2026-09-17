/**
 * Metadatos de los 66 libros de la Biblia (canon protestante), en español.
 *
 * Estos datos son estáticos y permiten construir la navegación (libro →
 * capítulo) sin depender de la base de datos. El TEXTO de los versículos sí
 * vive en la DB (tabla `bible_verses`, versión RVR1909).
 */

export type Testament = "AT" | "NT";

export type BibleBook = {
  /** Identificador estable en la URL, p. ej. "juan", "1-corintios". */
  slug: string;
  /** Nombre para mostrar, p. ej. "Juan", "1 Corintios". */
  name: string;
  testament: Testament;
  chapters: number;
};

export const BIBLE_BOOKS: readonly BibleBook[] = [
  // Antiguo Testamento
  { slug: "genesis", name: "Génesis", testament: "AT", chapters: 50 },
  { slug: "exodo", name: "Éxodo", testament: "AT", chapters: 40 },
  { slug: "levitico", name: "Levítico", testament: "AT", chapters: 27 },
  { slug: "numeros", name: "Números", testament: "AT", chapters: 36 },
  { slug: "deuteronomio", name: "Deuteronomio", testament: "AT", chapters: 34 },
  { slug: "josue", name: "Josué", testament: "AT", chapters: 24 },
  { slug: "jueces", name: "Jueces", testament: "AT", chapters: 21 },
  { slug: "rut", name: "Rut", testament: "AT", chapters: 4 },
  { slug: "1-samuel", name: "1 Samuel", testament: "AT", chapters: 31 },
  { slug: "2-samuel", name: "2 Samuel", testament: "AT", chapters: 24 },
  { slug: "1-reyes", name: "1 Reyes", testament: "AT", chapters: 22 },
  { slug: "2-reyes", name: "2 Reyes", testament: "AT", chapters: 25 },
  { slug: "1-cronicas", name: "1 Crónicas", testament: "AT", chapters: 29 },
  { slug: "2-cronicas", name: "2 Crónicas", testament: "AT", chapters: 36 },
  { slug: "esdras", name: "Esdras", testament: "AT", chapters: 10 },
  { slug: "nehemias", name: "Nehemías", testament: "AT", chapters: 13 },
  { slug: "ester", name: "Ester", testament: "AT", chapters: 10 },
  { slug: "job", name: "Job", testament: "AT", chapters: 42 },
  { slug: "salmos", name: "Salmos", testament: "AT", chapters: 150 },
  { slug: "proverbios", name: "Proverbios", testament: "AT", chapters: 31 },
  { slug: "eclesiastes", name: "Eclesiastés", testament: "AT", chapters: 12 },
  { slug: "cantares", name: "Cantares", testament: "AT", chapters: 8 },
  { slug: "isaias", name: "Isaías", testament: "AT", chapters: 66 },
  { slug: "jeremias", name: "Jeremías", testament: "AT", chapters: 52 },
  { slug: "lamentaciones", name: "Lamentaciones", testament: "AT", chapters: 5 },
  { slug: "ezequiel", name: "Ezequiel", testament: "AT", chapters: 48 },
  { slug: "daniel", name: "Daniel", testament: "AT", chapters: 12 },
  { slug: "oseas", name: "Oseas", testament: "AT", chapters: 14 },
  { slug: "joel", name: "Joel", testament: "AT", chapters: 3 },
  { slug: "amos", name: "Amós", testament: "AT", chapters: 9 },
  { slug: "abdias", name: "Abdías", testament: "AT", chapters: 1 },
  { slug: "jonas", name: "Jonás", testament: "AT", chapters: 4 },
  { slug: "miqueas", name: "Miqueas", testament: "AT", chapters: 7 },
  { slug: "nahum", name: "Nahúm", testament: "AT", chapters: 3 },
  { slug: "habacuc", name: "Habacuc", testament: "AT", chapters: 3 },
  { slug: "sofonias", name: "Sofonías", testament: "AT", chapters: 3 },
  { slug: "hageo", name: "Hageo", testament: "AT", chapters: 2 },
  { slug: "zacarias", name: "Zacarías", testament: "AT", chapters: 14 },
  { slug: "malaquias", name: "Malaquías", testament: "AT", chapters: 4 },
  // Nuevo Testamento
  { slug: "mateo", name: "Mateo", testament: "NT", chapters: 28 },
  { slug: "marcos", name: "Marcos", testament: "NT", chapters: 16 },
  { slug: "lucas", name: "Lucas", testament: "NT", chapters: 24 },
  { slug: "juan", name: "Juan", testament: "NT", chapters: 21 },
  { slug: "hechos", name: "Hechos", testament: "NT", chapters: 28 },
  { slug: "romanos", name: "Romanos", testament: "NT", chapters: 16 },
  { slug: "1-corintios", name: "1 Corintios", testament: "NT", chapters: 16 },
  { slug: "2-corintios", name: "2 Corintios", testament: "NT", chapters: 13 },
  { slug: "galatas", name: "Gálatas", testament: "NT", chapters: 6 },
  { slug: "efesios", name: "Efesios", testament: "NT", chapters: 6 },
  { slug: "filipenses", name: "Filipenses", testament: "NT", chapters: 4 },
  { slug: "colosenses", name: "Colosenses", testament: "NT", chapters: 4 },
  { slug: "1-tesalonicenses", name: "1 Tesalonicenses", testament: "NT", chapters: 5 },
  { slug: "2-tesalonicenses", name: "2 Tesalonicenses", testament: "NT", chapters: 3 },
  { slug: "1-timoteo", name: "1 Timoteo", testament: "NT", chapters: 6 },
  { slug: "2-timoteo", name: "2 Timoteo", testament: "NT", chapters: 4 },
  { slug: "tito", name: "Tito", testament: "NT", chapters: 3 },
  { slug: "filemon", name: "Filemón", testament: "NT", chapters: 1 },
  { slug: "hebreos", name: "Hebreos", testament: "NT", chapters: 13 },
  { slug: "santiago", name: "Santiago", testament: "NT", chapters: 5 },
  { slug: "1-pedro", name: "1 Pedro", testament: "NT", chapters: 5 },
  { slug: "2-pedro", name: "2 Pedro", testament: "NT", chapters: 3 },
  { slug: "1-juan", name: "1 Juan", testament: "NT", chapters: 5 },
  { slug: "2-juan", name: "2 Juan", testament: "NT", chapters: 1 },
  { slug: "3-juan", name: "3 Juan", testament: "NT", chapters: 1 },
  { slug: "judas", name: "Judas", testament: "NT", chapters: 1 },
  { slug: "apocalipsis", name: "Apocalipsis", testament: "NT", chapters: 22 },
] as const;

const BY_SLUG = new Map(BIBLE_BOOKS.map((b) => [b.slug, b]));
const BY_NAME = new Map(BIBLE_BOOKS.map((b) => [b.name.toLowerCase(), b]));

export function getBookBySlug(slug: string): BibleBook | undefined {
  return BY_SLUG.get(slug);
}

export function getBookByName(name: string): BibleBook | undefined {
  return BY_NAME.get(name.trim().toLowerCase());
}

/** ¿Es válido este capítulo (1..chapters) para el libro? */
export function isValidChapter(book: BibleBook, chapter: number): boolean {
  return Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters;
}
