import type { Metadata } from "next";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { INTEGRATIONS, integrationStatus, canSignIn } from "@/server/admin/integrations";
import { PageHeader, EmptyState, Notice, Badge, Card } from "@/components/ui";
import { IntegrationTest } from "./integration-test";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configuración" };

const STATE = {
  ok: { label: "Configurada", tone: "primary" as const },
  partial: { label: "Incompleta", tone: "accent" as const },
  missing: { label: "Falta", tone: "danger" as const },
};

export default async function ConfigPage() {
  const actor = await getActor();
  if (!can(actor, "plans:configure")) {
    return <EmptyState title="Acceso restringido">Solo administradores de plataforma.</EmptyState>;
  }
  const statuses = integrationStatus(process.env);
  const byId = new Map(statuses.map((s) => [s.id, s]));
  const requiredMissing = INTEGRATIONS.filter((i) => i.required && byId.get(i.id)?.state !== "ok");
  const signIn = canSignIn(process.env);

  return (
    <>
      <PageHeader
        eyebrow="Plataforma"
        title="Configuración"
        description="Estado de cada servicio externo y cómo conectarlo. Las claves se cargan en Vercel (Settings → Environment Variables); esta pantalla nunca muestra ni guarda sus valores."
      />

      <Card className={requiredMissing.length || !signIn ? "border-accent/50 bg-accent-soft/40" : "bg-primary-soft/50"}>
        {requiredMissing.length === 0 && signIn ? (
          <p className="font-medium">Lo esencial está configurado. ✓</p>
        ) : (
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-medium">Para lanzar falta:</p>
            <ul className="ml-5 list-disc">
              {requiredMissing.map((i) => (
                <li key={i.id}>{i.name}</li>
              ))}
              {!signIn && <li>Al menos un método de ingreso (Google o correo)</li>}
            </ul>
          </div>
        )}
      </Card>

      <Notice>
        Cómo cargar o cambiar una clave: en Vercel abrí tu proyecto → <strong>Settings → Environment Variables</strong>,
        escribí el nombre exacto y el valor, guardá y luego <strong>Redeploy</strong> para que se aplique. No hace falta
        tocar código.
      </Notice>

      <ul className="flex flex-col gap-3">
        {INTEGRATIONS.map((i) => {
          const st = byId.get(i.id)!;
          const s = STATE[st.state];
          return (
            <li key={i.id} className="rounded-3xl border border-border/80 bg-surface p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-semibold">{i.name}</h2>
                  <p className="text-sm text-muted-foreground">{i.purpose}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!i.required && <Badge>Opcional</Badge>}
                  <Badge tone={s.tone}>{s.label}</Badge>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {i.variables.map((v) => (
                  <code
                    key={v}
                    className={`rounded-lg px-2 py-1 text-xs ${
                      st.present.includes(v) ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {st.present.includes(v) ? "✓ " : "○ "}
                    {v}
                  </code>
                ))}
              </div>

              {st.notes.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 text-sm text-accent-foreground">
                  {st.notes.map((n) => (
                    <li key={n}>• {n}</li>
                  ))}
                </ul>
              )}

              {st.state !== "ok" && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-medium text-primary">Cómo obtenerla</summary>
                  <ol className="ml-5 mt-2 list-decimal space-y-1 text-muted-foreground">
                    {i.howTo.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ol>
                  {i.link && (
                    <a href={i.link.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-medium text-primary hover:underline">
                      {i.link.label} ↗
                    </a>
                  )}
                </details>
              )}

              {i.testable && st.present.length > 0 && <IntegrationTest id={i.id} />}
            </li>
          );
        })}
      </ul>
    </>
  );
}
