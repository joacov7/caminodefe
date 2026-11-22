import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookBySlug, isValidChapter } from "@/lib/bible/books";
import { getChapterVerses } from "@/lib/bible/queries";
import { plainVerse } from "@/lib/bible/format";
import { VerseText } from "@/components/verse-text";
import { Beacon } from "@/components/beacon";
import { RememberReading } from "@/components/last-read";
import { IconArrowLeft, IconArrowRight } from "@/components/icons";
import { FavoriteButton } from "./favorite-button";

type Params = { book: string; chapter: string };

// El texto bíblico no cambia: la página se cachea (rápida, indexable y apta
// para lectura sin conexión). Se regenera a diario por si la base se cargó
// después del primer acceso.
export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { book: slug, chapter } = await params;
  const book = getBookBySlug(slug);
  if (!book) return { title: "Biblia" };
  const n = Number(chapter);
  const res = isValidChapter(book, n) ? await getChapterVerses(book, n) : null;
  const first = res && res.ok ? plainVerse(res.verses[0]!.text).slice(0, 150) : undefined;
  const title = `${book.name} ${chapter}`;
  return {
    title: `${title} · RVR1909`,
    description: first ? `${first}…` : `${title}, Reina-Valera 1909.`,
    alternates: { canonical: `/biblia/${book.slug}/${chapter}` },
    openGraph: { title: `${title} (RVR1909)`, description: first },
  };
}

export default async function ChapterPage({ params }: { params: Promise<Params> }) {
  const { book: slug, chapter: chapterStr } = await params;
  const book = getBookBySlug(slug);
  const chapter = Number(chapterStr);
  if (!book || !isValidChapter(book, chapter)) notFound();

  const result = await getChapterVerses(book, chapter);
  const hasPrev = chapter > 1;
  const hasNext = chapter < book.chapters;
  const label = `${book.name} ${chapter}`;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6">
      <nav className="flex items-center justify-between text-sm">
        <Link href={`/biblia/${book.slug}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconArrowLeft className="h-4 w-4" /> {book.name}
        </Link>
        <span className="text-xs font-medium text-muted-foreground">RVR1909</span>
      </nav>

      <header className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          {book.name} <span className="text-accent">{chapter}</span>
        </h1>
        <FavoriteButton refId={`${book.slug}/${chapter}`} label={label} />
      </header>

      {result.ok ? (
        <article className="scripture space-y-2.5" aria-label={label}>
          {result.verses.map((v) => (
            <p key={v.verse} id={`v${v.verse}`} className="scroll-mt-24 rounded-lg target:bg-accent-soft">
              <sup>{v.verse}</sup>
              <VerseText text={v.text} />
            </p>
          ))}
          <Beacon event="bible_chapter_read" />
          <RememberReading href={`/biblia/${book.slug}/${chapter}`} label={label} />
        </article>
      ) : (
        <div role="status" className="rounded-3xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          {result.message}
        </div>
      )}

      {result.ok && (
        <p className="text-xs text-muted-foreground">
          Las palabras en <em className="italic">itálica</em> fueron añadidas por los traductores para dar sentido en
          castellano.
        </p>
      )}

      <nav aria-label="Capítulos" className="flex items-center justify-between gap-3 border-t border-border pt-5 text-sm">
        {hasPrev ? (
          <Link href={`/biblia/${book.slug}/${chapter - 1}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2.5 font-medium transition hover:bg-muted">
            <IconArrowLeft className="h-4 w-4" /> {chapter - 1}
          </Link>
        ) : (
          <span />
        )}
        <Link href="/asistente" className="text-muted-foreground hover:text-primary">¿Tenés una pregunta?</Link>
        {hasNext ? (
          <Link href={`/biblia/${book.slug}/${chapter + 1}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90">
            {chapter + 1} <IconArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
