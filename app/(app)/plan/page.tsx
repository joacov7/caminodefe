import type { Metadata } from "next";
import Link from "next/link";
import { getActor } from "@/server/authz/session";
import { getUserPlanId } from "@/server/billing/queries";
import { PLANS, formatAmount } from "@/server/billing/plans";
import { PlanActions } from "./plan-actions";

export const metadata: Metadata = { title: "Plan" };
export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const actor = await getActor();
  if (!actor.userId) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Tu plan</h1>
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Iniciá sesión para ver y cambiar tu plan.{" "}
          <Link href="/ingresar" className="font-medium text-primary hover:underline">
            Ingresar
          </Link>
        </p>
      </main>
    );
  }

  const planId = await getUserPlanId(actor.userId);
  const isPremium = planId === "premium";

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Tu plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan actual: <strong>{PLANS[isPremium ? "premium" : "free"].name}</strong>
        </p>
      </header>

      <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
        En esta etapa Camino de Fe funciona por <strong>donación voluntaria</strong>.
        Podés activar Premium para probar sus beneficios <strong>sin cargo</strong>;
        el cobro real todavía no está habilitado.
      </p>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(["free", "premium"] as const).map((id) => {
          const plan = PLANS[id];
          const current = isPremium ? id === "premium" : id === "free";
          return (
            <article
              key={id}
              className={`rounded-2xl border p-5 ${
                current ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">{plan.name}</h2>
                <span className="text-sm text-muted-foreground">
                  {plan.priceMinor === 0
                    ? "Gratis"
                    : `${formatAmount(plan.priceMinor, plan.currency)}/mes`}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.aiMessagesPerDay} consultas de IA por día
              </p>
              <ul className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
                {plan.benefits.map((b) => (
                  <li key={b}>· {b}</li>
                ))}
              </ul>
              {current && (
                <p className="mt-3 text-xs font-medium text-primary">Tu plan actual</p>
              )}
            </article>
          );
        })}
      </section>

      <PlanActions isPremium={isPremium} />

      <p className="text-sm">
        ¿Querés sostener el proyecto?{" "}
        <Link href="/apoyar" className="font-medium text-primary hover:underline">
          Apoyá Camino de Fe
        </Link>
      </p>

      <p className="text-xs text-muted-foreground">
        Nunca se bloquea el acceso a recursos gratuitos, información pastoral ni
        ayuda de emergencia por falta de pago.
      </p>
    </main>
  );
}
