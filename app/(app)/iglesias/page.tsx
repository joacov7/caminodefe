import type { Metadata } from "next";

export const metadata: Metadata = { title: "Iglesias" };

export default function IglesiasPage() {
  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Iglesias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Encontrá una comunidad local y, si querés, pedí contacto con un pastor.
          Siempre de forma voluntaria y respetuosa.
        </p>
      </header>

      <div className="flex items-center gap-2 rounded-2xl border border-border p-2">
        <input
          type="search"
          placeholder="Buscar iglesias por nombre o ciudad…"
          aria-label="Buscar iglesias"
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
        />
      </div>

      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        El directorio se conecta con la base de datos cuando haya iglesias
        verificadas cargadas. Cada iglesia decide qué información publica.
      </p>

      <section className="grid grid-cols-1 gap-4">
        <article className="rounded-2xl border border-border p-5">
          <h2 className="font-semibold">¿Tenés una iglesia?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Camino de Fe no busca reemplazar a la iglesia: ofrece herramientas
            digitales para servirla. El registro y la verificación de iglesias se
            habilitan en la Fase de Iglesias.
          </p>
        </article>
      </section>
    </main>
  );
}
