import type { Metadata } from "next";
import { getActor } from "@/server/authz/session";
import { managedChurchIds } from "@/server/churches/access";
import { getChurchesByIds, listChurchMembers } from "@/server/churches/queries";
import { PageHeader, EmptyState, SectionTitle, Notice } from "@/components/ui";
import { ChurchPicker } from "../church-picker";
import { MemberRow } from "./member-row";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Miembros · Panel pastoral" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ church?: string }> }) {
  const actor = await getActor();
  const ids = managedChurchIds(actor);
  if (ids.length === 0) return <EmptyState title="Acceso restringido">Solo pastores y líderes verificados.</EmptyState>;
  const churches = await getChurchesByIds(ids);
  const { church } = await searchParams;
  const selected = churches.find((c) => c.id === church) ?? churches[0]!;
  const members = await listChurchMembers(selected.id);
  const requested = members.filter((m) => m.status === "requested");
  const active = members.filter((m) => m.status === "active");

  return (
    <>
      <ChurchPicker churches={churches} selectedId={selected.id} basePath="/pastoral/miembros" />
      <PageHeader eyebrow={selected.name} title="Miembros" description="Personas que indicaron que forman parte de tu iglesia." />
      <section>
        <SectionTitle>Solicitudes ({requested.length})</SectionTitle>
        {requested.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {requested.map((m) => (
              <MemberRow key={m.userId} churchId={selected.id} member={{ ...m, linkedAt: m.linkedAt.toISOString() }} />
            ))}
          </ul>
        )}
      </section>
      <section>
        <SectionTitle>Miembros activos ({active.length})</SectionTitle>
        {active.length === 0 ? (
          <EmptyState title="Todavía no hay miembros">
            Compartí el enlace de tu perfil para que tu congregación se sume desde «Soy parte de esta iglesia».
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {active.map((m) => (
              <MemberRow key={m.userId} churchId={selected.id} member={{ ...m, linkedAt: m.linkedAt.toISOString() }} />
            ))}
          </ul>
        )}
      </section>
      <Notice>
        Solo ves el nombre y correo que cada persona compartió al sumarse. Su diario, notas, conversaciones y progreso
        son privados y no están disponibles para ningún pastor ni administrador.
      </Notice>
    </>
  );
}
