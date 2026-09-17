import type { Metadata } from "next";
import Link from "next/link";
import { BIBLE_BOOKS } from "@/lib/bible/books";

export const metadata: Metadata = { title: "Biblia" };

export default function BibliaIndexPage() {
  const at = BIBLE_BOOKS.filter((b) => b.testament === "AT");
  const nt = BIBLE_BOOKS.filter((b) => b.testament === "NT");

  return (
    <main className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold">Biblia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reina-Valera 1909 · dominio público
        </p>
      </header>

      <BookGroup title="Antiguo Testamento" books={at} />
      <BookGroup title="Nuevo Testamento" books={nt} />
    </main>
  );
}

function BookGroup({
  title,
  books,
}: {
  title: string;
  books: typeof BIBLE_BOOKS;
}) {
  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
        {title}
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {books.map((b) => (
          <li key={b.slug}>
            <Link
              href={`/biblia/${b.slug}/1`}
              className="block rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted/60"
            >
              {b.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
