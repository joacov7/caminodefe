import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { GUIDED_PATH, getStage, formatPassage } from "@/content/guided-path";
import { getPassage } from "@/lib/bible/queries";
import { getBookByName } from "@/lib/bible/books";
import { getGuidedProgress } from "@/server/journey/queries";
import { Card, SectionTitle, Notice } from "@/components/ui";
import { IconArrowLeft, IconArrowRight, IconChurch, IconChat } from "@/components/icons";
import { VerseText } from "@/components/verse-text";
import { StageCompletion } from "./stage-completion";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const stage = getStage(id);
  if (!stage) return { title: "Camino guiado" };
  return {
    title: `${stage.number}. ${stage.title}`,
    description: stage.tagline,
    openGraph: { title: `${stage.title} · Camino de Fe`, description: stage.tagline },
  };
}

export default async function StagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stage = getStage(id);
  if (!stage) notFound();

  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;
  const [passages, progress] = await Promise.all([
    Promise.all(stage.passages.map((p) => getPassage(p.book, p.chapter, p.from, p.to))),
    userId ? getGuidedProgress(userId).catch(() => []) : Promise.resolve([]),
  ]);
  const mine = progress.find((p) => p.stageId === stage.id);
  const prev = GUIDED_PATH[stage.number - 2];
  const next = GUIDED_PATH[stage.number];

  return (
    <main className="flex flex-col gap-8">
      <nav className="text-sm">
        <Link href="/camino" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconArrowLeft className="h-4 w-4" /> Camino guiado
        </Link>
      </nav>

      <header className="animate-rise">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Etapa {stage.number} de {GUIDED_PATH.length} · ~{stage.minutes} min
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{stage.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{stage.tagline}</p>
      </header>

      <section aria-labelledby="sec-lectura">
        <SectionTitle>
          <span id="sec-lectura">1 · Lo que dice la Biblia</span>
        </SectionTitle>
        <div className="flex flex-col gap-4">
          {stage.passages.map((p, i) => {
            const text = passages[i];
            const book = getBookByName(p.book);
            return (
              <Card key={i} as="article" className="border-l-4 border-l-accent">
                <p className="mb-2 text-sm font-semibold text-primary">
                  {book ? (
                    <Link href={`/biblia/${book.slug}/${p.chapter}#v${p.from}`} className="hover:underline">
                      {formatPassage(p)}
                    </Link>
                  ) : (
                    formatPassage(p)
                  )}
                  <span className="ml-2 font-normal text-muted-foreground">RVR1909</span>
                </p>
                {text ? (
                  <div className="scripture space-y-1">
                    {text.verses.map((v) => (
                      <p key={v.verse}>
                        <sup>{v.verse}</sup>
                        <VerseText text={v.text} />
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Abrí el pasaje en la Biblia para leerlo (el texto se muestra cuando la base bíblica está cargada).
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="sec-explicacion">
        <SectionTitle>
          <span id="sec-explicacion">2 · Para entenderlo</span>
        </SectionTitle>
        <div className="space-y-3 text-[1.02rem] leading-relaxed text-foreground/90">
          {stage.explanation.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Explicación preparada por el equipo editorial (interpretación evangélica común). El texto bíblico está arriba.
        </p>
      </section>

      <section aria-labelledby="sec-reflexion">
        <SectionTitle>
          <span id="sec-reflexion">3 · Para pensar</span>
        </SectionTitle>
        <ul className="flex flex-col gap-2">
          {stage.reflection.map((q, i) => (
            <li key={i} className="rounded-2xl bg-muted/70 px-4 py-3 text-[0.98rem]">
              {q}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sec-practica">
        <SectionTitle>
          <span id="sec-practica">4 · Para vivirlo</span>
        </SectionTitle>
        <Card className="bg-primary-soft/60">
          <p className="text-[1.02rem] leading-relaxed">{stage.practice}</p>
        </Card>
      </section>

      <StageCompletion
        stageId={stage.id}
        signedIn={Boolean(userId)}
        completed={Boolean(mine)}
        initialReflection={mine?.reflection ?? ""}
        nextHref={next ? `/camino/${next.id}` : "/planes"}
      />

      <section aria-label="Acompañamiento" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href={`/iglesias?motivo=${encodeURIComponent(stage.pastoralReason)}`}
          className="flex items-center gap-3 rounded-3xl border border-border/80 bg-surface p-4 shadow-soft transition hover:shadow-lift"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent-foreground">
            <IconChurch />
          </span>
          <span>
            <span className="block font-medium">Hablar con un pastor</span>
            <span className="block text-sm text-muted-foreground">«{stage.pastoralReason}»</span>
          </span>
        </Link>
        <Link
          href="/asistente"
          className="flex items-center gap-3 rounded-3xl border border-border/80 bg-surface p-4 shadow-soft transition hover:shadow-lift"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
            <IconChat />
          </span>
          <span>
            <span className="block font-medium">Tengo una pregunta</span>
            <span className="block text-sm text-muted-foreground">Consultá al asistente bíblico</span>
          </span>
        </Link>
      </section>

      <nav aria-label="Etapas" className="flex items-center justify-between gap-3 border-t border-border pt-5 text-sm">
        {prev ? (
          <Link href={`/camino/${prev.id}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <IconArrowLeft className="h-4 w-4" /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/camino/${next.id}`} className="inline-flex items-center gap-1.5 text-right font-medium text-primary">
            {next.title} <IconArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <Notice>
        Si estás atravesando una situación de riesgo o crisis, buscá ayuda humana ahora: en Argentina, 911 (emergencias)
        o 135 (asistencia al suicida).
      </Notice>
    </main>
  );
}
