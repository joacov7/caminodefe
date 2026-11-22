import type { Metadata } from "next";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { listLibrary } from "@/server/admin/metrics";
import { PageHeader, EmptyState, SectionTitle, Notice } from "@/components/ui";
import { LibraryManager } from "./library-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Biblioteca del asistente" };

export default async function LibraryPage() {
  const actor = await getActor();
  if (!can(actor, "library:review")) return <EmptyState title="Acceso restringido">Moderación de contenido.</EmptyState>;
  const entries = await listLibrary();
  return (
    <>
      <PageHeader
        eyebrow="Asistente bíblico"
        title="Biblioteca curada"
        description="Respuestas a preguntas frecuentes, escritas o revisadas por personas y aprobadas por el consejo. Se sirven sin costo de IA y con calidad garantizada."
      />
      <Notice>
        Revisión de cuatro ojos: la aprobación debe hacerla una persona distinta a quien redactó. Purgá la caché si cambia
        la declaración doctrinal o se corrige un criterio.
      </Notice>
      <SectionTitle>Entradas</SectionTitle>
      <LibraryManager
        entries={entries.map((e) => ({ ...e, createdAt: e.createdAt.toISOString(), retired: Boolean(e.retiredAt) }))}
      />
    </>
  );
}
