import type { Metadata } from "next";
import Link from "next/link";
import { listVerifiedChurches } from "@/server/churches/queries";
import { PageHeader, EmptyState, Card, Badge } from "@/components/ui";
import { IconPin, IconSearch, IconShield } from "@/components/icons";

export const metadata: Metadata = {
  title: "Iglesias",
  description: "Encontrá una iglesia evangélica verificada cerca tuyo: horarios, ubicación, eventos y contacto con un pastor.",
};
export const dynamic = "force-dynamic";

export default async function IglesiasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; motivo?: string }>;
}) {
  const { q, motivo } = await searchParams;
  const search = q?.trim().slice(0, 60) || undefined;
  const churches = await listVerifiedChurches(search).catch(() => null);
  const suffix = motivo ? `?motivo=${encodeURIComponent(motivo.slice(0, 120))}` : "";

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Comunidad"
        title="Encontrá una iglesia"
        description="Comunidades verificadas por el equipo de Camino de Fe. El contacto siempre es voluntario y respetuoso."
      />

      {motivo && (
        <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-foreground">
          Elegí una iglesia para enviar: <strong>«{motivo.slice(0, 120)}»</strong>
        </p>
      )}

      <form role="search" className="relative">
        <label htmlFor="q" className="sr-only">Buscar iglesias</label>
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input id="q" type="search" name="q" defaultValue={search} placeholder="Buscar por nombre o ciudad" className="input pl-10" />
        {motivo && <input type="hidden" name="motivo" value={motivo} />}
      </form>

      {churches === null ? (
        <EmptyState title="Directorio no disponible">El directorio se conecta con la base de datos una vez configurada.</EmptyState>
      ) : churches.length === 0 ? (
        <EmptyState title="No encontramos iglesias verificadas con esa búsqueda">
          Probá con otra ciudad o barrio.
        </EmptyState>
      ) : (
        <ul className="grid gap-3">
          {churches.map((c) => (
            <li key={c.id}>
              <Link
                href={motivo ? `/iglesias/${c.slug}/contactar${suffix}` : `/iglesias/${c.slug}`}
                className="group block rounded-3xl border border-border/80 bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-xl font-semibold">{c.name}</h2>
                  <Badge tone="primary">
                    <IconShield className="h-3 w-3" /> Verificada
                  </Badge>
                </div>
                {c.generalLocation && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <IconPin className="h-4 w-4" /> {c.generalLocation}
                  </p>
                )}
                {c.description && <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{c.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card className="bg-primary-soft/50">
        <h2 className="font-serif text-lg font-semibold">¿Sos pastor o líder?</h2>
        <p className="mt-1 text-sm text-foreground/80">
          Sumá tu iglesia gratis: perfil, horarios, eventos y una bandeja para recibir a quienes buscan una comunidad. La
          verificación la realiza el equipo de Camino de Fe.
        </p>
        <Link href="/iglesias/sumar" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          Quiero sumar mi iglesia →
        </Link>
      </Card>
    </main>
  );
}
