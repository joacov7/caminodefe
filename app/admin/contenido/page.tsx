import type { Metadata } from "next";
import Link from "next/link";
import { getActor } from "@/server/authz/session";
import { canManageContent } from "@/server/content/access";
import { listPlatformContent } from "@/server/content/queries";
import { ContentEditor } from "./editor";

export const metadata: Metadata = { title: "Contenidos (admin)" };
export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const actor = await getActor();

  if (!canManageContent(actor, null)) {
    return (
      <Shell>
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Acceso restringido a administradores y moderadores de plataforma.
        </p>
      </Shell>
    );
  }

  const items = await listPlatformContent();

  return (
    <Shell>
      <header>
        <h1 className="text-2xl font-semibold">Contenidos de plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Crear y publicar devocionales y estudios. Cada acción de publicación
          queda auditada.
        </p>
      </header>

      <ContentEditor
        items={(items ?? []).map((i) => ({
          id: i.id,
          type: i.type,
          title: i.title,
          origin: i.origin,
          status: i.editorialStatus,
        }))}
        dbReady={items !== null}
      />
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
