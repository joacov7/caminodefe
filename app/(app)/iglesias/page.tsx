import type { Metadata } from "next";
import Link from "next/link";
import { listVerifiedChurches } from "@/server/churches/queries";

export const metadata: Metadata = { title: "Iglesias" };
export const dynamic = "force-dynamic";

export default async function IglesiasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const churches = await listVerifiedChurches(q?.trim() || undefined);

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Iglesias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Encontrá una comunidad local. El contacto con un pastor siempre es
          voluntario y respetuoso.
        </p>
      </header>

      <form className="flex items-center gap-2 rounded-2xl border border-border p-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o ciudad…"
          aria-label="Buscar iglesias"
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Buscar
        </button>
      </form>

      {churches === null ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          El directorio se conecta con la base de datos una vez configurada.
        </p>
      ) : churches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No hay iglesias verificadas que coincidan con tu búsqueda.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {churches.map((c) => (
            <li key={c.id}>
              <Link
                href={`/iglesias/${c.slug}`}
                className="block rounded-2xl border border-border p-5 transition hover:bg-muted/50"
              >
                <h2 className="font-semibold text-primary">{c.name}</h2>
                {c.generalLocation && (
                  <p className="text-xs text-muted-foreground">{c.generalLocation}</p>
                )}
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <article className="rounded-2xl border border-border p-5">
        <h2 className="font-semibold">¿Tenés una iglesia?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Camino de Fe no busca reemplazar a la iglesia: ofrece herramientas
          digitales para servirla. El registro y la verificación se realizan con
          un proceso administrativo.
        </p>
      </article>
    </main>
  );
}
