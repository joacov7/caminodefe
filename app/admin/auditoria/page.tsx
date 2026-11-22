import type { Metadata } from "next";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { recentAudit } from "@/server/admin/metrics";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatEventDate } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Auditoría" };

export default async function AuditPage() {
  const actor = await getActor();
  if (!can(actor, "audit:view")) return <EmptyState title="Acceso restringido">Solo administradores.</EmptyState>;
  const rows = await recentAudit(200);
  return (
    <>
      <PageHeader eyebrow="Seguridad" title="Registro de auditoría" description="Acciones administrativas y pastorales sensibles (últimas 200). Sin contenido personal." />
      {rows.length === 0 ? (
        <EmptyState title="Sin registros">Todavía no hay acciones auditadas.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">Fecha</th>
                <th className="px-4 py-2 font-semibold">Acción</th>
                <th className="px-4 py-2 font-semibold">Entidad</th>
                <th className="px-4 py-2 font-semibold">Quién</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{formatEventDate(r.createdAt)}</td>
                  <td className="px-4 py-2 font-medium">{r.action}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.entity}</td>
                  <td className="px-4 py-2">{r.actorName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
