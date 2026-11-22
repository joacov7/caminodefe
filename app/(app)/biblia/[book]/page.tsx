import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BIBLE_BOOKS, getBookBySlug } from "@/lib/bible/books";
import { PageHeader } from "@/components/ui";
import { IconArrowLeft } from "@/components/icons";

export function generateStaticParams() {
  return BIBLE_BOOKS.map((b) => ({ book: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ book: string }> }): Promise<Metadata> {
  const { book } = await params;
  const b = getBookBySlug(book);
  return b ? { title: `${b.name} · Biblia`, description: `${b.name}: ${b.chapters} capítulos, Reina-Valera 1909.` } : { title: "Biblia" };
}

export default async function BookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params;
  const b = getBookBySlug(book);
  if (!b) notFound();
  return (
    <main className="flex flex-col gap-8">
      <nav className="text-sm">
        <Link href="/biblia" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconArrowLeft className="h-4 w-4" /> Biblia
        </Link>
      </nav>
      <PageHeader eyebrow={b.testament === "AT" ? "Antiguo Testamento" : "Nuevo Testamento"} title={b.name} description={`${b.chapters} capítulos`} />
      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-8">
        {Array.from({ length: b.chapters }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link
              href={`/biblia/${b.slug}/${n}`}
              className="grid aspect-square place-items-center rounded-2xl border border-border/70 bg-surface font-serif text-lg font-semibold transition hover:border-primary hover:text-primary"
            >
              {n}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
