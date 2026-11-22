import type { Metadata } from "next";
import Link from "next/link";
import { getActor } from "@/server/authz/session";
import { managedChurchIds } from "@/server/churches/access";
import { getChurchesByIds, getChurchStats, listContactRequests } from "@/server/churches/queries";
import { listChurchEventsForManagement } from "@/server/events/queries";
import { PageHeader, Stat, SectionTitle, EmptyState, Notice, ButtonLink } from "@/components/ui";
import { formatEventDate } from "@/lib/dates";
import { ContactInbox } from "./contact-inbox";
import { ChurchPicker } from "./church-picker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel pastoral" };

export default async function PastoralPage({ searchParams }: { searchParams: Promise<{ church?: string }> }) {
  const actor = await getActor();
  const ids = managedChurchIds(actor);

  if (ids.length === 0) {
    return (
      <EmptyState title="Panel para pastores y líderes verificados">
        Si gestionás una iglesia y no ves tus datos, verificá que tu rol esté aprobado por el equipo de Camino de Fe.
      </EmptyState>
    );
  }

  const churches = await getChurchesByIds(ids);
  const { church: selectedParam } = await searchParams;
  const selected = churches.find((c) => c.id === selectedParam) ?? churches[0]!;
  const now = Date.now();

  const [stats, requests, events] = await Promise.all([
    getChurchStats(selected.id),
    listContactRequests(selected.id),
    listChurchEventsForManagement(selected.id),
  ]);
  const upcoming = events.filter((e) => new Date(e.startsAt).getTime() >= now).reverse().slice(0, 4);

  return (
    <>
      <ChurchPicker churches={churches} selectedId={selected.id} basePath="/pastoral" />
      <PageHeader
        eyebrow="Panel pastoral"
        title={selected.name}
        description="Las personas que pidieron contacto, tus próximos eventos y la actividad de tu comunidad."
        action={<ButtonLink href={`/iglesias/${selected.slug}`} variant="secondary">Ver perfil público</ButtonLink>}
      />

      {stats && (
        <section className="grid grid-cols-3 gap-3">
          <Stat label="Miembros activos" value={stats.activeMembers} />
          <Stat label="Eventos" value={stats.events} />
          <Stat label="Solicitudes nuevas" value={stats.pendingRequests} />
        </section>
      )}

      <section>
        <SectionTitle>Solicitudes de contacto</SectionTitle>
        <ContactInbox
          requests={requests.map((r) => ({
            id: r.id,
            reason: r.reason,
            message: r.message,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </section>

      <section>
        <SectionTitle
          action={
            <Link href={`/pastoral/eventos?church=${selected.id}`} className="text-sm font-medium text-primary hover:underline">
              Gestionar eventos
            </Link>
          }
        >
          Próximos eventos
        </SectionTitle>
        {upcoming.length === 0 ? (
          <EmptyState
            title="Sin eventos próximos"
            action={<ButtonLink href={`/pastoral/eventos?church=${selected.id}`}>Crear un evento</ButtonLink>}
          >
            Publicá cultos especiales, encuentros o actividades para que te encuentren.
          </EmptyState>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {upcoming.map((e) => (
              <li key={e.id} className="rounded-2xl border border-border/80 bg-surface p-4 shadow-soft">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">{formatEventDate(e.startsAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Notice>
        Privacidad: no se muestran conversaciones con el asistente, notas, diario ni progreso de las personas. Solo lo que
        cada una decidió enviarte.
      </Notice>
    </>
  );
}
