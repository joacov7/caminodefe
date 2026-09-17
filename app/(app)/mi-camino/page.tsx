import type { Metadata } from "next";
import Link from "next/link";
import { getActor } from "@/server/authz/session";
import { listNotes, listJournal, listFavorites } from "@/server/camino/queries";
import { MiCamino } from "./mi-camino";

export const metadata: Metadata = { title: "Mi Camino" };
export const dynamic = "force-dynamic";

export default async function MiCaminoPage() {
  const actor = await getActor();

  if (!actor.userId) {
    return (
      <main className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold">Mi Camino</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu espacio personal y privado.
          </p>
        </header>
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Iniciá sesión para ver y guardar tus notas, diario y favoritos.{" "}
          <Link href="/ingresar" className="font-medium text-primary hover:underline">
            Ingresar
          </Link>
        </p>
      </main>
    );
  }

  const [notes, journal, favorites] = await Promise.all([
    listNotes(actor.userId),
    listJournal(actor.userId),
    listFavorites(actor.userId),
  ]);

  return (
    <MiCamino
      notes={notes.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        linkedRef: n.linkedRef,
        updatedAt: n.updatedAt.toISOString(),
      }))}
      journal={journal.map((j) => ({
        id: j.id,
        entry: j.entry,
        createdAt: j.createdAt.toISOString(),
      }))}
      favorites={favorites.map((f) => ({
        id: f.id,
        refType: f.refType,
        refId: f.refId,
        label: f.label,
      }))}
    />
  );
}
