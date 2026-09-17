import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedContent } from "@/server/content/queries";
import { ORIGIN_LABELS, TYPE_LABELS, type ContentOrigin, type ContentType } from "@/server/content/editorial";

export const metadata: Metadata = { title: "Contenidos" };
export const dynamic = "force-dynamic";

export default async function ContenidosPage() {
  const items = await listPublishedContent();

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Contenidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Devocionales y estudios para acompañar tu camino.
        </p>
      </header>

      {items === null ? (
        <Empty>Los contenidos se conectan con la base una vez configurada.</Empty>
      ) : items.length === 0 ? (
        <Empty>Todavía no hay contenidos publicados.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/contenidos/${it.id}`}
                className="block rounded-2xl border border-border p-5 transition hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {TYPE_LABELS[it.type as ContentType] ?? it.type}
                  </span>
                  <span className="text-xs text-primary">
                    {ORIGIN_LABELS[it.origin as ContentOrigin]}
                  </span>
                </div>
                <h2 className="mt-2 font-semibold">{it.title}</h2>
                {it.objective && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {it.objective}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
