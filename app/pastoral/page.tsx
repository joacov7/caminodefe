import type { Metadata } from "next";
import Link from "next/link";
import { getActor } from "@/server/authz/session";
import { managedChurchIds } from "@/server/churches/access";
import {
  getChurchesByIds,
  getChurchStats,
  listContactRequests,
  getUpcomingEvents,
} from "@/server/churches/queries";
import { ContactInbox } from "./contact-inbox";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel pastoral" };

export default async function PastoralPage({
  searchParams,
}: {
  searchParams: Promise<{ church?: string }>;
}) {
  const actor = await getActor();
  const ids = managedChurchIds(actor);

  if (ids.length === 0) {
    return (
      <Shell>
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Este panel es para pastores y líderes verificados. Si gestionás una
          iglesia y no ves tus datos, verificá que tu rol esté aprobado.
        </p>
      </Shell>
    );
  }

  const churches = await getChurchesByIds(ids);
  const { church: selectedParam } = await searchParams;
  const selected =
    churches.find((c) => c.id === selectedParam) ?? churches[0]!;

  const [stats, requests, events] = await Promise.all([
    getChurchStats(selected.id),
    listContactRequests(selected.id),
    getUpcomingEvents(selected.id, false),
  ]);

  return (
    <Shell>
      {churches.length > 1 && (
        <nav className="flex flex-wrap gap-2">
          {churches.map((c) => (
            <Link
              key={c.id}
              href={`/pastoral?church=${c.id}`}
              className={`rounded-full border px-3 py-1 text-sm ${
                c.id === selected.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      <header>
        <h1 className="text-2xl font-semibold">{selected.name}</h1>
        <p className="text-sm text-muted-foreground">Panel pastoral</p>
      </header>

      {stats && (
        <section className="grid grid-cols-3 gap-3">
          <Stat label="Miembros activos" value={stats.activeMembers} />
          <Stat label="Eventos" value={stats.events} />
          <Stat label="Solicitudes nuevas" value={stats.pendingRequests} />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
          Solicitudes de contacto
        </h2>
        <ContactInbox
          requests={requests.map((r) => ({
            id: r.id,
            reason: r.reason,
            message: r.message,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
          Próximos eventos
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos próximos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {events.map((e) => (
              <li key={e.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium">{e.title}</p>
                <p className="text-muted-foreground">
                  {new Date(e.startsAt).toLocaleString("es-AR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        No se muestran conversaciones privadas, notas ni diagnósticos de las
        personas. Solo información operativa y lo que cada usuario decidió
        compartir.
      </p>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border p-4 text-center">
      <p className="text-2xl font-semibold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
