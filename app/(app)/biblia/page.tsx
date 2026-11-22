import type { Metadata } from "next";
import Link from "next/link";
import { BIBLE_BOOKS, type BibleBook } from "@/lib/bible/books";
import { PageHeader, SectionTitle } from "@/components/ui";
import { ContinueReading } from "@/components/last-read";

export const metadata: Metadata = {
  title: "Biblia",
  description: "La Biblia completa en español, Reina-Valera 1909 (dominio público). Leé por libro y capítulo, también sin conexión.",
};

const START_HERE = [
  { slug: "juan", label: "Juan", desc: "Conocer a Jesús" },
  { slug: "salmos", label: "Salmos", desc: "Oraciones y consuelo" },
  { slug: "genesis", label: "Génesis", desc: "El comienzo" },
  { slug: "romanos", label: "Romanos", desc: "El Evangelio explicado" },
];

export default function BibliaIndexPage() {
  const at = BIBLE_BOOKS.filter((b) => b.testament === "AT");
  const nt = BIBLE_BOOKS.filter((b) => b.testament === "NT");
  return (
    <main className="flex flex-col gap-8">
      <PageHeader eyebrow="Reina-Valera 1909 · dominio público" title="La Biblia" description="66 libros. Elegí uno para empezar o seguí donde dejaste." />
      <ContinueReading />
      <section>
        <SectionTitle>Para empezar</SectionTitle>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {START_HERE.map((s) => (
            <li key={s.slug}>
              <Link href={`/biblia/${s.slug}`} className="block rounded-3xl border border-border/80 bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
                <span className="block font-serif text-lg font-semibold">{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <BookGroup title="Nuevo Testamento" books={nt} />
      <BookGroup title="Antiguo Testamento" books={at} />
    </main>
  );
}

function BookGroup({ title, books }: { title: string; books: readonly BibleBook[] }) {
  return (
    <section aria-label={title}>
      <SectionTitle>{title}</SectionTitle>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {books.map((b) => (
          <li key={b.slug}>
            <Link href={`/biblia/${b.slug}`} className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm transition hover:bg-surface hover:shadow-soft">
              <span className="font-medium">{b.name}</span>
              <span className="text-xs text-muted-foreground">{b.chapters}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
