import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActor } from "@/server/authz/session";
import { getConversationWithMessages } from "@/server/ai/conversations";
import { Composer } from "../composer";

export const metadata: Metadata = { title: "Conversación" };
export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await getActor();

  if (!actor.userId) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Conversación</h1>
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Iniciá sesión para ver esta conversación.{" "}
          <Link href="/ingresar" className="font-medium text-primary hover:underline">
            Ingresar
          </Link>
        </p>
      </main>
    );
  }

  const data = await getConversationWithMessages(actor.userId, id).catch(() => null);
  if (!data) notFound();

  const initialTurns = data.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return (
    <main className="flex min-h-[70dvh] flex-col gap-6">
      <nav className="text-sm">
        <Link href="/asistente/historial" className="text-primary hover:underline">
          ← Historial
        </Link>
      </nav>
      <header>
        <h1 className="text-xl font-semibold">
          {data.conversation.title ?? "Conversación"}
        </h1>
      </header>
      <div className="mt-auto">
        <Composer conversationId={id} initialTurns={initialTurns} />
      </div>
    </main>
  );
}
