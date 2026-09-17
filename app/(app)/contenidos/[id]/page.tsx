import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedContent } from "@/server/content/queries";
import {
  ORIGIN_LABELS,
  TYPE_LABELS,
  type ContentOrigin,
  type ContentType,
} from "@/server/content/editorial";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getPublishedContent(id);
  return { title: item?.title ?? "Contenido" };
}

export default async function ContenidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getPublishedContent(id);
  if (!item) notFound();

  return (
    <main className="flex flex-col gap-5">
      <nav className="text-sm">
        <Link href="/contenidos" className="text-primary hover:underline">
          ← Contenidos
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {TYPE_LABELS[item.type as ContentType] ?? item.type}
        </span>
        <span className="text-xs text-primary">
          {ORIGIN_LABELS[item.origin as ContentOrigin]}
        </span>
      </div>

      <header>
        <h1 className="text-2xl font-semibold">{item.title}</h1>
        {item.passage && (
          <p className="mt-1 text-sm text-primary">{item.passage}</p>
        )}
        {item.author && (
          <p className="mt-1 text-xs text-muted-foreground">Por {item.author}</p>
        )}
      </header>

      {item.objective && (
        <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {item.objective}
        </p>
      )}

      {item.body && (
        <article className="whitespace-pre-wrap leading-relaxed">{item.body}</article>
      )}

      {item.origin === "ai" && (
        <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
          Este contenido fue generado con asistencia de IA y revisado según el
          flujo editorial. No sustituye la predicación ni la enseñanza pastoral.
        </p>
      )}
    </main>
  );
}
