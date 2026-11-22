/**
 * Versículo del día: selección curada (rotación determinista por fecha, igual
 * para todos ese día → se puede comentar en comunidad). El texto se lee de la
 * base; aquí solo están las referencias.
 */
export type DailyRef = { book: string; chapter: number; verse: number };

export const DAILY_VERSES: readonly DailyRef[] = [
  { book: "Salmos", chapter: 23, verse: 1 },
  { book: "Juan", chapter: 3, verse: 16 },
  { book: "Isaías", chapter: 41, verse: 10 },
  { book: "Mateo", chapter: 11, verse: 28 },
  { book: "Filipenses", chapter: 4, verse: 13 },
  { book: "Romanos", chapter: 8, verse: 28 },
  { book: "Proverbios", chapter: 3, verse: 5 },
  { book: "Jeremías", chapter: 29, verse: 11 },
  { book: "Isaías", chapter: 40, verse: 31 },
  { book: "Josué", chapter: 1, verse: 9 },
  { book: "Lamentaciones", chapter: 3, verse: 22 },
  { book: "Mateo", chapter: 6, verse: 33 },
  { book: "2 Corintios", chapter: 12, verse: 9 },
  { book: "Juan", chapter: 14, verse: 27 },
  { book: "1 Juan", chapter: 4, verse: 19 },
  { book: "Salmos", chapter: 121, verse: 2 },
  { book: "Romanos", chapter: 12, verse: 12 },
  { book: "Hebreos", chapter: 11, verse: 1 },
  { book: "Efesios", chapter: 2, verse: 10 },
  { book: "Salmos", chapter: 37, verse: 5 },
  { book: "1 Pedro", chapter: 5, verse: 7 },
];

/** Índice estable por día calendario (UTC-3, Argentina). */
export function dailyVerseFor(date: Date = new Date()): DailyRef {
  const local = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const dayNumber = Math.floor(local.getTime() / 86_400_000);
  return DAILY_VERSES[((dayNumber % DAILY_VERSES.length) + DAILY_VERSES.length) % DAILY_VERSES.length]!;
}
