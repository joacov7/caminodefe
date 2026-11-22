import type { Metadata } from "next";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { platformMetrics } from "@/server/admin/metrics";
import { PageHeader, Stat, SectionTitle, EmptyState, Card } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración" };

const EVENT_LABELS: Record<string, string> = {
  bible_chapter_read: "Capítulos leídos",
  devotional_read: "Devocionales leídos",
  assistant_answer: "Respuestas del asistente",
  guided_stage_completed: "Etapas del camino recorridas",
  reading_day_completed: "Días de plan leídos",
  plan_started: "Planes iniciados",
  church_profile_view: "Visitas a perfiles de iglesia",
  contact_request_sent: "Mensajes a pastores",
  event_view: "Visitas a eventos",
  event_calendar_added: "Eventos agregados al calendario",
  signup: "Registros",
};

export default async function AdminHome() {
  const actor = await getActor();
  if (!can(actor, "platform:view_metrics")) {
    return <EmptyState title="Acceso restringido">Solo administradores de plataforma.</EmptyState>;
  }
  const m = await platformMetrics();
  if (!m) return <EmptyState title="Base de datos no configurada">Configurá DATABASE_URL.</EmptyState>;

  const totals = new Map<string, number>();
  for (const e of m.events) totals.set(e.event, (totals.get(e.event) ?? 0) + e.total);
  const connections = (totals.get("contact_request_sent") ?? 0) + (totals.get("event_calendar_added") ?? 0);

  return (
    <>
      <PageHeader
        eyebrow="Últimos 30 días"
        title="Salud de la plataforma"
        description="Métricas agregadas y anónimas. Métrica norte: personas que se conectan con una iglesia local."
      />
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Conexiones con iglesias" value={connections} hint="mensajes + eventos agendados" />
        <Stat label="Usuarios registrados" value={m.users} />
        <Stat label="Iglesias verificadas" value={m.churches.verified} hint={`${m.churches.pending} pendientes`} />
        <Stat label="Respuestas del asistente" value={m.ai.answers} hint={`${Math.round(m.ai.cachedShare * 100)} % sin costo (caché/biblioteca)`} />
      </section>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Costo IA (USD)" value={m.ai.costUsd.toFixed(2)} />
        <Stat label="Costo IA por usuario activo" value={`US$ ${m.ai.costPerActiveUserUsd.toFixed(4)}`} />
        <Stat label="Respuestas en caché" value={m.cacheEntries} />
        <Stat label="Biblioteca publicada" value={m.libraryPublished} />
      </section>
      <Card>
        <SectionTitle>Actividad</SectionTitle>
        {totals.size === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad registrada todavía.</p>
        ) : (
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {[...totals.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-border/60 py-1.5 text-sm">
                  <dt className="text-muted-foreground">{EVENT_LABELS[k] ?? k}</dt>
                  <dd className="font-semibold tabular-nums">{v.toLocaleString("es-AR")}</dd>
                </div>
              ))}
          </dl>
        )}
      </Card>
    </>
  );
}
