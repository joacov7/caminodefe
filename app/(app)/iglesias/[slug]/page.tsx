import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVerifiedChurchBySlug, getServiceTimes, getMembershipStatus } from "@/server/churches/queries";
import { listChurchUpcomingVisible } from "@/server/events/queries";
import { getActor } from "@/server/authz/session";
import { track } from "@/server/platform/analytics";
import { Card, ButtonLink, SectionTitle, Badge } from "@/components/ui";
import { IconArrowLeft, IconPin, IconClock, IconShield, IconCalendar } from "@/components/icons";
import { ShareButton } from "@/components/share-button";
import { MembershipButton } from "./membership-button";
import { dateBadge, formatTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const church = await getVerifiedChurchBySlug(slug).catch(() => null);
  if (!church) return { title: "Iglesia" };
  const description =
    church.description?.slice(0, 160) ?? `Horarios, eventos y contacto de ${church.name}${church.generalLocation ? ` en ${church.generalLocation}` : ""}.`;
  return { title: church.name, description, openGraph: { title: church.name, description } };
}

export default async function ChurchProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const church = await getVerifiedChurchBySlug(slug);
  if (!church) notFound();
  const actor = await getActor();
  const [times, events, membership] = await Promise.all([
    getServiceTimes(church.id),
    listChurchUpcomingVisible(church.id, actor),
    actor.userId ? getMembershipStatus(actor.userId, church.id).catch(() => null) : Promise.resolve(null),
  ]);
  void track("church_profile_view");

  return (
    <main className="flex flex-col gap-8">
      <nav className="text-sm">
        <Link href="/iglesias" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconArrowLeft className="h-4 w-4" /> Iglesias
        </Link>
      </nav>

      <header className="relative overflow-hidden rounded-4xl bg-primary px-6 py-8 text-primary-foreground shadow-lift sm:px-8">
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-10 h-60 w-60 rounded-full bg-accent/40 blur-3xl" />
        <span className="relative inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-medium">
          <IconShield className="h-3 w-3" /> Iglesia verificada
        </span>
        <h1 className="relative mt-3 font-serif text-4xl font-semibold tracking-tight">{church.name}</h1>
        {church.generalLocation && (
          <p className="relative mt-2 flex items-center gap-1.5 text-primary-foreground/85">
            <IconPin className="h-4 w-4" /> {church.generalLocation}
          </p>
        )}
        <div className="relative mt-6 flex flex-wrap gap-3">
          <Link
            href={`/iglesias/${church.slug}/contactar`}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-soft transition hover:bg-accent/90"
          >
            Hablar con un pastor
          </Link>
          <Link
            href={`/iglesias/${church.slug}/contactar?motivo=${encodeURIComponent("Quiero visitar la iglesia")}`}
            className="rounded-full bg-primary-foreground/15 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-primary-foreground/25"
          >
            Quiero visitarla
          </Link>
          <MembershipButton churchId={church.id} slug={church.slug} status={membership} signedIn={Boolean(actor.userId)} />
          <ShareButton
            title={church.name}
            text={`Conocé ${church.name} en Camino de Fe`}
            path={`/iglesias/${church.slug}`}
            className="rounded-full px-3 py-2.5 text-sm font-medium text-primary-foreground/85 hover:bg-primary-foreground/10"
          />
        </div>
      </header>

      {church.description && <p className="text-[1.05rem] leading-relaxed text-foreground/90">{church.description}</p>}

      {times.length > 0 && (
        <section>
          <SectionTitle>Reuniones</SectionTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {times.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-border/80 bg-surface p-4">
                <IconClock className="h-5 w-5 text-primary" />
                <span>
                  <span className="block font-medium first-letter:uppercase">
                    {t.day} · {t.time} h
                  </span>
                  {t.label && <span className="text-sm text-muted-foreground">{t.label}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle>Próximos eventos</SectionTitle>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta iglesia todavía no publicó eventos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {events.map((e) => {
              const b = dateBadge(e.startsAt);
              return (
                <li key={e.id}>
                  <Link href={`/eventos/${e.id}`} className="flex items-center gap-4 rounded-2xl border border-border/80 bg-surface p-3 transition hover:shadow-soft">
                    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-soft text-accent-foreground">
                      <span className="font-serif text-lg font-semibold leading-none">{b.day}</span>
                      <span className="text-[0.65rem] font-semibold uppercase">{b.month}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.title}</span>
                      <span className="text-sm text-muted-foreground">{formatTime(e.startsAt)} h</span>
                    </span>
                    {e.visibility === "members" && <Badge tone="accent">Miembros</Badge>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {church.doctrinalStatement && (
        <Card>
          <SectionTitle>Lo que creemos</SectionTitle>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{church.doctrinalStatement}</p>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {church.website && (
          <ButtonLink href={church.website} variant="secondary" target="_blank" rel="noopener noreferrer">
            Sitio web ↗
          </ButtonLink>
        )}
        <ButtonLink href="/eventos" variant="ghost">
          <IconCalendar className="h-4 w-4" /> Todos los eventos
        </ButtonLink>
      </div>
    </main>
  );
}
