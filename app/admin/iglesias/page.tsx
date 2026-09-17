import type { Metadata } from "next";
import Link from "next/link";
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
        <h1 className="text-2xl font-semibold">Verificación de iglesias</h1>
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
              }}
            />
          ))}
        </ul>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 text-sm">
        <Link href="/inicio" className="text-primary hover:underline">
          ← Volver a la app
        </Link>
      </nav>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}
