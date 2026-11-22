import type { Metadata } from "next";
import { getActor } from "@/server/authz/session";
import { managedChurchIds } from "@/server/churches/access";
import { getChurchesByIds } from "@/server/churches/queries";
import { listChurchEventsForManagement } from "@/server/events/queries";
import { PageHeader, EmptyState, SectionTitle } from "@/components/ui";
import { EventManager } from "./event-manager";
import { ChurchPicker } from "../church-picker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Eventos · Panel pastoral" };

export default async function PastoralEventsPage({ searchParams }: { searchParams: Promise<{ church?: string }> }) {
  const actor = await getActor();
  const ids = managedChurchIds(actor);
  if (ids.length === 0) {
    return <EmptyState title="Acceso restringido">Solo pastores y líderes verificados pueden gestionar eventos.</EmptyState>;
  }
  const churches = await getChurchesByIds(ids);
  const { church } = await searchParams;
  const selected = churches.find((c) => c.id === church) ?? churches[0]!;
  const events = await listChurchEventsForManagement(selected.id);

  return (
    <>
      <ChurchPicker churches={churches} selectedId={selected.id} basePath="/pastoral/eventos" />
      <PageHeader
        eyebrow={selected.name}
        title="Eventos"
        description="Los eventos públicos aparecen en tu perfil y en la agenda de Camino de Fe. Los de «miembros» solo los ven miembros de tu iglesia."
      />
      <SectionTitle>Agenda</SectionTitle>
      <EventManager
        churchId={selected.id}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          location: e.location,
          onlineUrl: e.onlineUrl,
          startsAt: new Date(e.startsAt).toISOString(),
          endsAt: e.endsAt ? new Date(e.endsAt).toISOString() : null,
          visibility: e.visibility as "public" | "members",
        }))}
      />
    </>
  );
}
