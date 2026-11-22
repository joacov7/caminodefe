import type { Metadata } from "next";
import { getActor } from "@/server/authz/session";
import { managedChurchIds } from "@/server/churches/access";
import { getChurchesByIds } from "@/server/churches/queries";
import { listChurchPrayers } from "@/server/prayer/queries";
import { PageHeader, EmptyState, Notice } from "@/components/ui";
import { ChurchPicker } from "../church-picker";
import { PrayingButton } from "./praying-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Oración · Panel pastoral" };

export default async function PastoralPrayerPage({ searchParams }: { searchParams: Promise<{ church?: string }> }) {
  const actor = await getActor();
  const ids = managedChurchIds(actor);
  if (ids.length === 0 || !actor.userId) return <EmptyState title="Acceso restringido">Solo pastores y líderes verificados.</EmptyState>;
  const churches = await getChurchesByIds(ids);
  const { church } = await searchParams;
  const selected = churches.find((c) => c.id === church) ?? churches[0]!;
  const prayers = await listChurchPrayers(actor.userId, selected.id);
  const fmt = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });

  return (
    <>
      <ChurchPicker churches={churches} selectedId={selected.id} basePath="/pastoral/oracion" />
      <PageHeader
        eyebrow={selected.name}
        title="Pedidos de oración"
        description="Pedidos que miembros de tu iglesia decidieron compartir con el equipo pastoral. Marcá «Estamos orando» para que la persona sepa que no está sola."
      />
      {prayers.length === 0 ? (
        <EmptyState title="Todavía no hay pedidos compartidos">
          Los miembros pueden compartir pedidos desde la sección Oración de la app.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {prayers.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border/80 bg-surface p-4">
              <p className="text-xs text-muted-foreground">
                {fmt.format(p.createdAt)} · {p.name ?? "Sin nombre (eligió anonimato)"}
              </p>
              <p className="mt-1 whitespace-pre-line leading-relaxed">{p.body}</p>
              <div className="mt-3">
                {p.status === "open" ? (
                  <PrayingButton id={p.id} />
                ) : (
                  <span className="text-sm font-medium text-primary">
                    {p.status === "praying" ? "✓ Estamos orando" : "✓ La persona marcó que fue respondido"}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Notice>
        Confidencialidad pastoral: estos pedidos no se muestran a otros miembros ni a la administración de la plataforma.
        No se pueden editar ni reenviar desde aquí.
      </Notice>
    </>
  );
}
