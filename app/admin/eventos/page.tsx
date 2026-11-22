import type { Metadata } from "next";
import Link from "next/link";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { listAllEventsForAdmin } from "@/server/events/queries";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { formatEventDate } from "@/lib/dates";
import { AdminDeleteEvent } from "./admin-delete-event";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Eventos · Administración" };

export default async function AdminEventsPage() {
  const actor = await getActor();
  if (!can(actor, "platform:view_metrics")) return <EmptyState title="Acceso restringido">Solo administradores.</EmptyState>;
  const events = await listAllEventsForAdmin();
  return (
    <>
      <PageHeader eyebrow="Moderación" title="Eventos" description="Todos los eventos de todas las iglesias. Las eliminaciones quedan auditadas." />
      {events.length === 0 ? (
        <EmptyState title="Sin eventos">Todavía no se publicaron eventos.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface p-4">
              <div className="min-w-0">
                <Link href={`/eventos/${e.id}`} className="font-medium hover:underline">{e.title}</Link>
                <p className="text-sm text-muted-foreground">{formatEventDate(e.startsAt)} · {e.churchName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{e.visibility === "public" ? "Público" : "Miembros"}</Badge>
                <AdminDeleteEvent id={e.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
