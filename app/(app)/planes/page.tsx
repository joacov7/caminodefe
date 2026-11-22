import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { READING_PLANS } from "@/content/reading-plans";
import { getPlanProgress } from "@/server/journey/queries";
import { planStatus } from "@/server/journey/progress";
import { PageHeader, Progress, Badge, LinkRow } from "@/components/ui";
import { IconBell } from "@/components/icons";

export const metadata: Metadata = {
  title: "Planes de lectura",
  description: "Planes de lectura bíblica de 7 y 30 días, con una pregunta para reflexionar cada día.",
};
export const dynamic = "force-dynamic";

export default async function PlanesPage() {
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  const progress: Record<string, number[]> = userId ? await getPlanProgress(userId).catch(() => ({})) : {};

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Lectura"
        title="Planes de lectura"
        description="Unos minutos por día con la Palabra. Si te atrasás, no pasa nada: seguís donde quedaste."
      />

      <ul className="grid gap-4">
        {READING_PLANS.map((plan) => {
          const st = planStatus(plan, progress[plan.id] ?? []);
          return (
            <li key={plan.id}>
              <Link
                href={`/planes/${plan.id}`}
                className="group block rounded-3xl border border-border/80 bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge tone="primary">{plan.days} días</Badge>
                      <Badge>~{plan.minutesPerDay} min/día</Badge>
                      {st.finished && <Badge tone="accent">Completado</Badge>}
                    </div>
                    <h2 className="font-serif text-xl font-semibold">{plan.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.subtitle}</p>
                  </div>
                  <span aria-hidden className="mt-1 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary">
                    →
                  </span>
                </div>
                {st.completedCount > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs text-muted-foreground">
                      {st.finished ? "¡Terminaste este plan!" : `Día ${st.nextDay} · ${st.completedCount} de ${plan.days} leídos`}
                    </p>
                    <Progress value={st.completedCount} max={plan.days} label={`Progreso en ${plan.title}`} />
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <LinkRow
        href="/perfil/recordatorios"
        title="Recordatorio diario"
        desc="Elegí la hora y agregalo al calendario de tu teléfono"
        icon={<IconBell />}
      />
    </main>
  );
}
