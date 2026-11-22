import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getGuidedProgress } from "@/server/journey/queries";
import { stageStates } from "@/server/journey/progress";
import { GUIDED_PATH } from "@/content/guided-path";
import { PageHeader, Progress, Notice, ButtonLink } from "@/components/ui";
import { IconCheck } from "@/components/icons";

export const metadata: Metadata = {
  title: "Camino guiado",
  description:
    "Diez etapas para conocer a Jesús, entender el Evangelio, aprender a orar y leer la Biblia, y encontrar una comunidad. Gratis y a tu ritmo.",
};
export const dynamic = "force-dynamic";

export default async function CaminoPage() {
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  const progress = userId ? await getGuidedProgress(userId).catch(() => []) : [];
  const completed = new Set(progress.map((p) => p.stageId));
  const states = stageStates(completed);
  const current = states.find((s) => s.state === "current");

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Camino guiado"
        title="Paso a paso, a tu ritmo"
        description="Diez etapas para conocer a Jesús y crecer en la fe, con la Biblia, preguntas para pensar y una práctica sencilla. No hay puntajes ni comparaciones: es tu camino."
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-surface p-5 shadow-soft">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {completed.size === 0
              ? "Todavía no empezaste"
              : completed.size === GUIDED_PATH.length
                ? "Recorriste todo el camino"
                : `${completed.size} de ${GUIDED_PATH.length} etapas recorridas`}
          </span>
          {current && <ButtonLink href={`/camino/${current.stage.id}`}>{completed.size ? "Continuar" : "Comenzar"}</ButtonLink>}
        </div>
        <Progress value={completed.size} max={GUIDED_PATH.length} label="Etapas recorridas" />
      </div>

      {!userId && (
        <Notice>
          Podés leer todas las etapas sin cuenta.{" "}
          <Link href="/ingresar?callbackUrl=/camino" className="font-medium text-primary underline-offset-2 hover:underline">
            Ingresá
          </Link>{" "}
          para guardar tu progreso y tus reflexiones (solo vos las ves).
        </Notice>
      )}

      <ol className="relative flex flex-col gap-3" aria-label="Etapas del camino">
        <span aria-hidden className="absolute bottom-6 left-[1.45rem] top-6 w-px bg-border" />
        {states.map(({ stage, state }) => (
          <li key={stage.id} className="relative">
            <Link
              href={`/camino/${stage.id}`}
              className={[
                "group flex items-start gap-4 rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lift",
                state === "current"
                  ? "border-primary/40 bg-surface shadow-soft ring-2 ring-primary/10"
                  : "border-transparent hover:border-border hover:bg-surface",
              ].join(" ")}
            >
              <span
                className={[
                  "relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-serif text-lg font-semibold",
                  state === "completed"
                    ? "bg-primary text-primary-foreground"
                    : state === "current"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {state === "completed" ? <IconCheck /> : stage.number}
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span className="flex items-center gap-2">
                  <span className="font-serif text-lg font-semibold">{stage.title}</span>
                  {state === "current" && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.7rem] font-semibold text-accent-foreground">
                      Siguiente
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{stage.tagline}</span>
                <span className="mt-1 block text-xs text-muted-foreground/80">~{stage.minutes} min</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <Notice tone="accent">
        Este camino fue preparado con un enfoque evangélico interdenominacional. No reemplaza a tu iglesia: en cada
        etapa podés pedir que un pastor te acompañe.
      </Notice>
    </main>
  );
}
