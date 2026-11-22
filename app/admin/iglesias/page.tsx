import type { Metadata } from "next";
import { getActor } from "@/server/authz/session";
import { canVerifyChurches } from "@/server/churches/access";
import { listAllChurches } from "@/server/churches/queries";
import { VerificationRow } from "./verification-row";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verificación de iglesias" };

export default async function AdminChurchesPage() {
  const actor = await getActor();

  if (!canVerifyChurches(actor)) {
    return (
      <Shell>
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Acceso restringido a administradores de plataforma.
        </p>
      </Shell>
    );
  }

  const churches = await listAllChurches();

  return (
    <Shell>
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Verificación de iglesias</h1>
        <p className="text-sm text-muted-foreground">
          Aprobá, rechazá o suspendé iglesias. Cada acción queda auditada.
        </p>
      </header>

      {churches === null ? (
        <p className="text-sm text-muted-foreground">
          Base de datos no configurada.
        </p>
      ) : churches.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay iglesias registradas.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {churches.map((c) => (
            <VerificationRow
              key={c.id}
              church={{
                id: c.id,
                name: c.name,
                status: c.status,
                location: c.generalLocation,
                contactEmail: c.contact?.email ?? null,
                contactPhone: c.contact?.phone ?? null,
                requester: c.requesterName ? `${c.requesterName} (${c.requesterEmail ?? "sin correo"})` : c.requesterEmail,
                requestedRole: c.contact?.requestedRole ?? null,
                plan: c.plan,
              }}
            />
          ))}
        </ul>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>;
}
