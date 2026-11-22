import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDevotionalOfDay } from "@/server/content/queries";
import { getGuidedProgress, getPlanProgress } from "@/server/journey/queries";
import { nextStage, planStatus } from "@/server/journey/progress";
import { listPublicUpcomingEvents } from "@/server/events/queries";
import { getPassage } from "@/lib/bible/queries";
import { dailyVerseFor } from "@/lib/bible/daily";
import { getBookByName } from "@/lib/bible/books";
import { plainVerse } from "@/lib/bible/format";
import { GUIDED_PATH } from "@/content/guided-path";
import { READING_PLANS, formatReading } from "@/content/reading-plans";
import { Card, ButtonLink, SectionTitle, Progress, Badge, LinkRow } from "@/components/ui";
import { IconChat, IconChurch, IconCalendar, IconPath, IconFlame, IconBook } from "@/components/icons";
import { ShareButton } from "@/components/share-button";
import { formatEventDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Inicio" };
export const dynamic = "force-dynamic";

function greeting(now = new Date()): string {
  const h = Number(
    new Intl.DateTimeFormat("es-AR", { hour: "numeric", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).format(now),
  );
  if (h < 12) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default async function InicioPage() {
  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;
  const firstName = session?.user?.name?.split(" ")[0];

  const daily = dailyVerseFor();
  const [verse, devotional, progress, planDays, events] = await Promise.all([
    getPassage(daily.book, daily.chapter, daily.verse),
    getDevotionalOfDay().catch(() => null),
    userId ? getGuidedProgress(userId).catch(() => []) : Promise.resolve([]),
    userId
      ? getPlanProgress(userId).catch((): Record<string, number[]> => ({}))
      : Promise.resolve({} as Record<string, number[]>),
    listPublicUpcomingEvents({ limit: 3 }).catch(() => null),
  ]);

  const completed = new Set(progress.map((p) => p.stageId));
  const stage = nextStage(completed);
  const activePlans = READING_PLANS.map((p) => ({ plan: p, status: planStatus(p, planDays[p.id] ?? []) })).filter(
    (x) => x.status.completedCount > 0 && !x.status.finished,
  );
  const verseText = verse?.verses[0]?.text;
  const verseRef = `${daily.book} ${daily.chapter}:${daily.verse}`;
  const book = getBookByName(daily.book);

  return (
    <main className="flex flex-col gap-8">
      <header className="animate-rise">
        <p className="text-sm text-muted-foreground">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Tu camino de hoy
        </h1>
      </header>

      {/* Versículo del día */}
      <section
        aria-label="Versículo del día"
        className="relative overflow-hidden rounded-4xl bg-primary px-6 py-8 text-primary-foreground shadow-lift animate-rise sm:px-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent/40 blur-3xl"
        />
        <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
          Versículo del día
        </p>
        {verseText ? (
          <blockquote className="relative mt-3 font-serif text-2xl leading-snug sm:text-[1.7rem]">
            “{plainVerse(verseText)}”
          </blockquote>
        ) : (
          <p className="relative mt-3 font-serif text-xl">{verseRef}</p>
        )}
        <div className="relative mt-5 flex flex-wrap items-center gap-3">
          {book && (
            <Link
              href={`/biblia/${book.slug}/${daily.chapter}#v${daily.verse}`}
              className="rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-primary-foreground/25"
            >
              {verseRef} · RVR1909
            </Link>
          )}
          {verseText && (
            <ShareButton
              title={verseRef}
              text={`“${plainVerse(verseText)}” — ${verseRef} (RVR1909)`}
              path={book ? `/biblia/${book.slug}/${daily.chapter}` : "/biblia"}
              className="rounded-full px-3 py-2 text-sm font-medium text-primary-foreground/85 hover:bg-primary-foreground/10"
            />
          )}
        </div>
      </section>

      {/* Camino guiado */}
      <section aria-label="Camino guiado">
        <SectionTitle action={<Link href="/camino" className="text-sm font-medium text-primary hover:underline">Ver todo</Link>}>
          Camino guiado
        </SectionTitle>
        <Card className="flex flex-col gap-4">
          {stage ? (
            <>
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft font-serif text-xl font-semibold text-accent-foreground">
                  {stage.number}
                </span>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {completed.size === 0 ? "Empezá por acá" : `Etapa ${stage.number} de ${GUIDED_PATH.length}`}
                  </p>
                  <h2 className="font-serif text-xl font-semibold">{stage.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{stage.tagline}</p>
                </div>
              </div>
              <Progress value={completed.size} max={GUIDED_PATH.length} label="Etapas completadas" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">~{stage.minutes} min · a tu ritmo</span>
                <ButtonLink href={`/camino/${stage.id}`}>
                  {completed.size === 0 ? "Comenzar" : "Continuar"}
                </ButtonLink>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Recorriste las 10 etapas. Seguí creciendo con un plan de lectura.
              </p>
              <ButtonLink href="/planes" variant="secondary">Planes</ButtonLink>
            </div>
          )}
        </Card>
      </section>

      {/* Planes activos */}
      <section aria-label="Lectura">
        <SectionTitle action={<Link href="/planes" className="text-sm font-medium text-primary hover:underline">Planes</Link>}>
          Lectura
        </SectionTitle>
        {activePlans.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {activePlans.map(({ plan, status }) => {
              const day = plan.schedule[(status.nextDay ?? 1) - 1]!;
              return (
                <Card as="li" key={plan.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {plan.title} · Día {day.day} de {plan.days}
                    </p>
                    <p className="truncate font-medium">{day.title}</p>
                    <p className="text-sm text-muted-foreground">{day.readings.map(formatReading).join(" · ")}</p>
                  </div>
                  <ButtonLink href={`/planes/${plan.id}#dia-${day.day}`} variant="secondary">Leer</ButtonLink>
                </Card>
              );
            })}
          </ul>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {devotional ? (
              <LinkRow
                href={`/contenidos/${devotional.id}`}
                title={devotional.title}
                desc={`Devocional del día${devotional.passage ? ` · ${devotional.passage}` : ""}`}
                icon={<IconBook />}
              />
            ) : null}
            <LinkRow
              href="/planes/esperanza-7-dias"
              title="Esperanza en 7 días"
              desc="Un plan breve para empezar hoy"
              icon={<IconFlame />}
            />
          </div>
        )}
      </section>

      {/* Comunidad */}
      <section aria-label="Comunidad">
        <SectionTitle action={<Link href="/eventos" className="text-sm font-medium text-primary hover:underline">Eventos</Link>}>
          Tu comunidad
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LinkRow href="/iglesias" title="Encontrar una iglesia" desc="Horarios, ubicación y contacto con un pastor" icon={<IconChurch />} />
          <LinkRow href="/asistente" title="Preguntar sobre la Biblia" desc="Con citas verificadas en el texto" icon={<IconChat />} />
        </div>
        {events && events.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/eventos/${e.id}`}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-muted"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent-foreground">
                    <IconCalendar />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatEventDate(e.startsAt)} · {e.churchName}
                    </span>
                  </span>
                  <Badge>{e.onlineUrl ? "En línea" : "Presencial"}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!userId && (
        <Card className="flex flex-col items-start gap-3 bg-accent-soft/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface text-primary">
              <IconPath />
            </span>
            <p className="text-sm">
              <span className="font-medium">Creá tu cuenta gratis</span> para guardar tu progreso, tus notas y tus
              recordatorios. Todo queda privado.
            </p>
          </div>
          <ButtonLink href="/ingresar">Crear cuenta</ButtonLink>
        </Card>
      )}
    </main>
  );
}
