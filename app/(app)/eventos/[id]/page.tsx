import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActor } from "@/server/authz/session";
import { getVisibleEvent } from "@/server/events/queries";
import { track } from "@/server/platform/analytics";
import { Card, ButtonLink, Badge, Notice } from "@/components/ui";
import { IconArrowLeft, IconCalendar, IconPin, IconVideo, IconChurch } from "@/components/icons";
import { ShareButton } from "@/components/share-button";
import { formatLongDate, formatTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = await getVisibleEvent(id, { userId: null, roles: [] }).catch(() => null);
  if (!e) return { title: "Evento" };
  const description = `${formatLongDate(e.startsAt)} · ${e.churchName}${e.location ? ` · ${e.location}` : ""}`;
  return { title: e.title, description, openGraph: { title: e.title, description } };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActor();
  const e = await getVisibleEvent(id, actor).catch(() => null);
  if (!e) notFound();
  void track("event_view");

  return (
    <main className="flex flex-col gap-6">
      <nav className="text-sm">
        <Link href="/eventos" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconArrowLeft className="h-4 w-4" /> Eventos
        </Link>
      </nav>

      <header className="animate-rise">
        {e.visibility === "members" && <Badge tone="accent">Solo para miembros</Badge>}
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{e.title}</h1>
        <Link href={`/iglesias/${e.churchSlug}`} className="mt-2 inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconChurch className="h-4 w-4" /> {e.churchName}
        </Link>
      </header>

      <Card className="flex flex-col gap-3">
        <p className="flex items-center gap-3">
          <IconCalendar className="h-5 w-5 text-primary" />
          <span>
            <span className="block font-medium first-letter:uppercase">{formatLongDate(e.startsAt)}</span>
            <span className="text-sm text-muted-foreground">
              {formatTime(e.startsAt)} h{e.endsAt ? ` a ${formatTime(e.endsAt)} h` : ""}
            </span>
          </span>
        </p>
        {e.location && (
          <p className="flex items-center gap-3">
            <IconPin className="h-5 w-5 text-primary" />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {e.location}
            </a>
          </p>
        )}
        {e.onlineUrl && (
          <p className="flex items-center gap-3">
            <IconVideo className="h-5 w-5 text-primary" />
            <a href={e.onlineUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">
              Unirse a la transmisión ↗
            </a>
          </p>
        )}
      </Card>

      {e.description && <p className="whitespace-pre-line leading-relaxed text-foreground/90">{e.description}</p>}

      <div className="flex flex-wrap gap-3">
        <ButtonLink href={`/api/eventos/${e.id}/ics`}>
          <IconCalendar className="h-4 w-4" /> Agregar a mi calendario
        </ButtonLink>
        <ButtonLink href={`/iglesias/${e.churchSlug}/contactar?motivo=${encodeURIComponent("Quiero visitar la iglesia")}`} variant="secondary">
          Avisar que voy
        </ButtonLink>
        <ShareButton
          title={e.title}
          text={`${e.title} — ${formatLongDate(e.startsAt)} (${e.churchName})`}
          path={`/eventos/${e.id}`}
          className="rounded-full px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-soft"
        />
      </div>

      <Notice>Las actividades son organizadas por cada iglesia. Ante dudas, contactala directamente.</Notice>
    </main>
  );
}
