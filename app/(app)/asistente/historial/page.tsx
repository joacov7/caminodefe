import type { Metadata } from "next";
import Link from "next/link";
import { getActor } from "@/server/authz/session";
import { listConversations } from "@/server/ai/conversations";
import { HistoryList } from "./history-list";

export const metadata: Metadata = { title: "Historial" };
export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const actor = await getActor();

  if (!actor.userId) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Historial</h1>
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Iniciá sesión para ver tus conversaciones.{" "}
          <Link href="/ingresar" className="font-medium text-primary hover:underline">
            Ingresar
          </Link>
        </p>
      </main>
    );
  }

  let conversations: { id: string; title: string | null; createdAt: Date }[] = [];
  try {
    conversations = await listConversations(actor.userId);
  } catch {
    conversations = [];
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Historial</h1>
        <Link
          href="/asistente"
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Nueva conversación
        </Link>
      </header>

      <p className="text-xs text-muted-foreground">
        Tus conversaciones son privadas. Podés eliminarlas cuando quieras.
      </p>

      <HistoryList
        conversations={conversations.map((c) => ({
          id: c.id,
          title: c.title ?? "Conversación",
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
