import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookBySlug, isValidChapter } from "@/lib/bible/books";
import { getChapterVerses } from "@/lib/bible/queries";
import { FavoriteButton } from "./favorite-button";

type Params = { book: string; chapter: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { book: slug, chapter } = await params;
  const book = getBookBySlug(slug);
  if (!book) return { title: "Biblia" };
  return { title: `${book.name} ${chapter}` };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { book: slug, chapter: chapterStr } = await params;
  const book = getBookBySlug(slug);
  const chapter = Number(chapterStr);

  if (!book || !isValidChapter(book, chapter)) {
    notFound();
  }

  const result = await getChapterVerses(book, chapter);
  const hasPrev = chapter > 1;
  const hasNext = chapter < book.chapters;

  return (
    <main className="flex flex-col gap-6">
      <nav className="text-sm">
        <Link href="/biblia" className="text-primary hover:underline">
          ← Biblia
        </Link>
      </nav>

      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {book.name}{" "}
          <span className="text-muted-foreground">{chapter}</span>
        </h1>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground">RVR1909</span>
          <FavoriteButton
            refId={`${book.slug}/${chapter}`}
            label={`${book.name} ${chapter}`}
          />
        </div>
      </header>

      {result.ok ? (
        <article className="space-y-3 font-serif text-lg leading-relaxed">
          {result.verses.map((v) => (
            <p key={v.verse}>
              <sup className="mr-1 align-super text-xs font-sans font-semibold text-primary">
                {v.verse}
              </sup>
              {v.text}
            </p>
          ))}
        </article>
      ) : (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground"
        >
          {result.message}
        </div>
      )}

      <nav
        aria-label="Navegación de capítulos"
        className="flex items-center justify-between border-t border-border pt-4 text-sm"
      >
        {hasPrev ? (
          <Link
            href={`/biblia/${book.slug}/${chapter - 1}`}
            className="rounded-full border border-border px-4 py-2 transition hover:bg-muted"
          >
            ← Capítulo {chapter - 1}
          </Link>
        ) : (
          <span />
        )}
        {hasNext ? (
          <Link
            href={`/biblia/${book.slug}/${chapter + 1}`}
            className="rounded-full border border-border px-4 py-2 transition hover:bg-muted"
          >
            Capítulo {chapter + 1} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
