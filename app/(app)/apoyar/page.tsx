import type { Metadata } from "next";
import Link from "next/link";
import { getActor } from "@/server/authz/session";
import { listMyContributions } from "@/server/billing/queries";
import { formatAmount } from "@/server/billing/plans";
import { CONTRIBUTION_LABELS, type ContributionType } from "@/server/billing/donations";
import { DonateForm } from "./donate-form";

export const metadata: Metadata = { title: "Apoyar" };
export const dynamic = "force-dynamic";

export default async function ApoyarPage() {
  const actor = await getActor();
  if (!actor.userId) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Apoyá Camino de Fe</h1>
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Iniciá sesión para registrar un aporte.{" "}
          <Link href="/ingresar" className="font-medium text-primary hover:underline">
            Ingresar
          </Link>
        </p>
      </main>
    );
  }

  const contributions = await listMyContributions(actor.userId);

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Apoyá Camino de Fe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu aporte es voluntario y ayuda a sostener el proyecto. Sin presión ni
          promesas: das lo que quieras, cuando quieras.
        </p>
      </header>

      <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
        El cobro real todavía no está habilitado. Por ahora tu aporte se{" "}
        <strong>registra como pendiente</strong> (no se procesa dinero) para que
        podamos coordinar los medios de pago con transparencia.
      </p>

      <DonateForm />

      {contributions.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Tus aportes
          </h2>
          <ul className="flex flex-col gap-2">
            {contributions.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
              >
                <span>{CONTRIBUTION_LABELS[c.type as ContributionType]}</span>
                <span className="text-muted-foreground">
                  {formatAmount(c.amountMinor, c.currency)} · {c.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Los fondos se separan por destino y el destinatario siempre es visible. No
        se aplican descuentos ni porcentajes automáticos.
      </p>
    </main>
  );
}
