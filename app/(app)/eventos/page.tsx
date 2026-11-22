import type { Metadata } from "next";
import Link from "next/link";
import { listPublicUpcomingEvents } from "@/server/events/queries";
import { PageHeader, EmptyState, Badge, ButtonLink } from "@/components/ui";
import { dateBadge, formatTime } from "@/lib/dates";
import { IconPin, IconVideo, IconSearch } from "@/components/icons";

export const metadata: Metadata = {
  title: "Eventos",
  description: "Cultos especiales, encuentros y actividades de iglesias verificadas cerca tuyo.",
};
export const dynamic = "force-dynamic";

export default async function EventosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const search = q?.trim().slice(0, 60) || undefined;
  const events = await listPublicUpcomingEvents({ search }).catch(() => null);

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Comunidad"
        title="Eventos"
        description="Actividades abiertas de iglesias verificadas. Agregalas a tu calendario con un toque."
      />

      <form role="search" className="relative">
        <label htmlFor="q" className="sr-only">Buscar eventos</label>
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input id="q" name="q" defaultValue={search} placeholder="Buscar por ciudad, iglesia o actividad" className="input pl-10" />
      </form>

      {events === null ? (
        <EmptyState title="Eventos no disponibles">La base de datos no está configurada en este entorno.</EmptyState>
      ) : events.length === 0 ? (
        <EmptyState
          title={search ? "No encontramos eventos con esa búsqueda" : "Todavía no hay eventos publicados"}
          action={<ButtonLink href="/iglesias" variant="secondary">Ver iglesias</ButtonLink>}
        >
          Las iglesias verificadas publican sus actividades acá.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((e) => {
            const b = dateBadge(e.startsAt);
            return (
              <li key={e.id}>
                <Link
                  href={`/eventos/${e.id}`}
                  className="group flex gap-4 rounded-3xl border border-border/80 bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-accent-soft text-accent-foreground">
                    <span className="font-serif text-2xl font-semibold leading-none">{b.day}</span>
                    <span className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wider">{b.month}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-lg font-semibold leading-tight">{e.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {formatTime(e.startsAt)} h · {e.churchName}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-2">
                      {e.location && (
                        <Badge>
                          <IconPin className="h-3 w-3" /> {e.location}
                        </Badge>
                      )}
                      {e.onlineUrl && (
                        <Badge tone="primary">
                          <IconVideo className="h-3 w-3" /> En línea
                        </Badge>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
