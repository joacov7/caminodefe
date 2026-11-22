import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/auth-actions";
import { getActor } from "@/server/authz/session";
import { managedChurchIds } from "@/server/churches/access";
import { can } from "@/server/authz/permissions";
import { listMyChurches, listMyContactRequests } from "@/server/churches/queries";
import { PageHeader, Card, LinkRow, SectionTitle, Badge, ButtonLink } from "@/components/ui";
import {
  IconBookmark,
  IconBell,
  IconShield,
  IconChurch,
  IconCalendar,
  IconFlame,
  IconHeart,
  IconSparkle,
  IconGrid,
} from "@/components/icons";
import { formatEventDate } from "@/lib/dates";
import { WithdrawButton } from "./withdraw-button";

export const metadata: Metadata = { title: "Más" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "neutral" | "primary" | "accent" }> = {
  sent: { label: "Enviada", tone: "accent" },
  received: { label: "Recibida", tone: "primary" },
  in_progress: { label: "En curso", tone: "primary" },
  resolved: { label: "Resuelta", tone: "neutral" },
  withdrawn: { label: "Retirada", tone: "neutral" },
};

export default async function PerfilPage() {
  const session = await auth().catch(() => null);
  const user = session?.user;
  const actor = await getActor();
  const [churches, requests] = user?.id
    ? await Promise.all([listMyChurches(user.id).catch(() => []), listMyContactRequests(user.id).catch(() => [])])
    : [[], []];
  const isPastor = managedChurchIds(actor).length > 0;
  const isAdmin = can(actor, "platform:view_metrics") || can(actor, "content:moderate");

  return (
    <main className="flex flex-col gap-8">
      <PageHeader eyebrow="Tu cuenta" title={user?.name ?? "Más"} description={user?.email ?? "Explorá todo Camino de Fe."} />

      {!user && (
        <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">Ingresá para guardar tu progreso, tus notas y conectar con tu iglesia.</p>
          <ButtonLink href="/ingresar">Ingresar</ButtonLink>
        </Card>
      )}

      {(isPastor || isAdmin) && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {isPastor && <LinkRow href="/pastoral" title="Panel pastoral" desc="Bandeja, eventos y miembros" icon={<IconChurch />} />}
          {isAdmin && <LinkRow href="/admin" title="Administración" desc="Métricas, verificación y contenidos" icon={<IconGrid />} />}
        </section>
      )}

      <section>
        <SectionTitle>Explorar</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LinkRow href="/iglesias" title="Iglesias" desc="Encontrá una comunidad cerca" icon={<IconChurch />} />
          <LinkRow href="/eventos" title="Eventos" desc="Actividades abiertas" icon={<IconCalendar />} />
          <LinkRow href="/planes" title="Planes de lectura" desc="7 y 30 días" icon={<IconFlame />} />
          <LinkRow href="/contenidos" title="Devocionales y estudios" desc="Para tu día a día" icon={<IconSparkle />} />
        </div>
      </section>

      {user && (
        <section>
          <SectionTitle>Personal</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LinkRow href="/mi-camino" title="Mi espacio" desc="Notas, diario y favoritos (privado)" icon={<IconBookmark />} />
            <LinkRow href="/perfil/recordatorios" title="Recordatorios" desc="Tu momento diario, en tu calendario" icon={<IconBell />} />
            <LinkRow href="/perfil/privacidad" title="Privacidad y datos" desc="Exportá o eliminá tus datos" icon={<IconShield />} />
            <LinkRow href="/apoyar" title="Apoyar el proyecto" desc="Donación voluntaria" icon={<IconHeart />} />
          </div>
        </section>
      )}

      {churches.length > 0 && (
        <section>
          <SectionTitle>Mis iglesias</SectionTitle>
          <ul className="flex flex-col gap-2">
            {churches.map((c) => (
              <li key={c.churchId}>
                <Link href={`/iglesias/${c.slug}`} className="flex items-center justify-between rounded-2xl border border-border/80 bg-surface p-4 hover:shadow-soft">
                  <span className="font-medium">{c.name}</span>
                  <Badge tone={c.status === "active" ? "primary" : "accent"}>{c.status === "active" ? "Miembro" : "Pendiente"}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {requests.length > 0 && (
        <section>
          <SectionTitle>Mis mensajes a pastores</SectionTitle>
          <ul className="flex flex-col gap-2">
            {requests.map((r) => {
              const st = STATUS[r.status] ?? STATUS.sent!;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface p-4">
                  <span>
                    <span className="block font-medium">{r.churchName}</span>
                    <span className="text-xs text-muted-foreground">{formatEventDate(r.createdAt)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {(r.status === "sent" || r.status === "received" || r.status === "in_progress") && <WithdrawButton id={r.id} />}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {user && (
        <section className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Link href="/plan" className="text-sm font-medium text-primary hover:underline">
            Tu plan
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted">
              Cerrar sesión
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
