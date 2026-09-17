"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteConversationAction } from "@/server/ai/conversation-actions";

type Conv = { id: string; title: string; createdAt: string };

export function HistoryList({ conversations }: { conversations: Conv[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (conversations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Todavía no tenés conversaciones guardadas.
      </p>
    );
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteConversationAction(id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-muted-foreground">{error}</p>}
      {conversations.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
        >
          <Link href={`/asistente/${c.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{c.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(c.createdAt).toLocaleDateString("es-AR")}
            </p>
          </Link>
          <button
            onClick={() => remove(c.id)}
            disabled={pending}
            className="shrink-0 text-xs text-muted-foreground hover:underline"
          >
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}
