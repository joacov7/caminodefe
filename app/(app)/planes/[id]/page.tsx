import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPlan, formatReading } from "@/content/reading-plans";
import { getBookByName } from "@/lib/bible/books";
import { getPlanDays } from "@/server/journey/queries";
import { planStatus } from "@/server/journey/progress";
import { PageHeader, Progress, Notice } from "@/components/ui";
import { IconArrowLeft } from "@/components/icons";
import { DayToggle, ResetPlan } from "./plan-controls";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const plan = getPlan(id);
  return plan ? { title: plan.title, description: plan.subtitle } : { title: "Plan de lectura" };
}

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) notFound();
  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;
  const days = userId ? await getPlanDays(userId, plan.id).catch(() => []) : [];
  const done = new Set(days);
  const st = planStatus(plan, days);

  return (
    <main className="flex flex-col gap-8">
      <nav className="text-sm">
        <Link href="/planes" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconArrowLeft className="h-4 w-4" /> Planes
        </Link>
      </nav>

      <PageHeader
        eyebrow={`${plan.days} días · ~${plan.minutesPerDay} min por día`}
        title={plan.title}
        description={
          <>
            {plan.subtitle} <span className="block pt-1 text-sm">{plan.audience}</span>
          </>
        }
      />

      {userId ? (
        <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-soft">
          <p className="mb-2 text-sm font-medium">
            {st.finished
              ? "¡Completaste este plan! Gracias por perseverar."
              : st.completedCount === 0
                ? "Empezá por el día 1 cuando quieras."
                : `Seguís en el día ${st.nextDay}.`}
          </p>
          <Progress value={st.completedCount} max={plan.days} label="Días leídos" />
          {st.completedCount > 0 && <ResetPlan planId={plan.id} />}
        </div>
      ) : (
        <Notice>
          <Link href={`/ingresar?callbackUrl=/planes/${plan.id}`} className="font-medium text-primary hover:underline">
            Ingresá
          </Link>{" "}
          para marcar tus lecturas y retomar donde dejaste.
        </Notice>
      )}

      <ol className="flex flex-col gap-3">
        {plan.schedule.map((d) => {
          const isNext = d.day === st.nextDay;
          return (
            <li
              key={d.day}
              id={`dia-${d.day}`}
              className={[
                "scroll-mt-24 rounded-3xl border p-4 transition sm:p-5",
                isNext && userId ? "border-primary/40 bg-surface shadow-soft ring-2 ring-primary/10" : "border-border/70 bg-surface/60",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                {userId ? (
                  <DayToggle planId={plan.id} day={d.day} done={done.has(d.day)} />
                ) : (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {d.day}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Día {d.day}</p>
                  <h2 className="font-serif text-lg font-semibold">{d.title}</h2>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {d.readings.map((r, i) => {
                      const book = getBookByName(r.book);
                      return (
                        <li key={i}>
                          <Link
                            href={book ? `/biblia/${book.slug}/${r.chapter}${r.from ? `#v${r.from}` : ""}` : "/biblia"}
                            className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary hover:bg-primary/15"
                          >
                            {formatReading(r)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground/80">Para pensar: </span>
                    {d.question}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
