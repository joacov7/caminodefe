"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLibraryEntry, setLibraryStatus, retireLibraryEntry, purgeAnswerCache } from "@/server/ai/library-actions";
import { buttonClass, Badge } from "@/components/ui";
import type { EditorialStatus } from "@/server/content/editorial";

type Entry = {
  id: string;
  question: string;
  answer: string;
  status: string;
  hits: number;
  retired: boolean;
  hasEmbedding: boolean;
};

const NEXT: Record<string, { to: EditorialStatus; label: string }[]> = {
  draft: [{ to: "review", label: "Enviar a revisión" }],
  review: [
    { to: "approved", label: "Aprobar" },
    { to: "draft", label: "Devolver a borrador" },
  ],
  approved: [
    { to: "published", label: "Publicar" },
    { to: "review", label: "Volver a revisión" },
  ],
  published: [{ to: "review", label: "Despublicar" }],
};
const LABEL: Record<string, string> = { draft: "Borrador", review: "En revisión", approved: "Aprobada", published: "Publicada" };

export function LibraryManager({ entries }: { entries: Entry[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; error?: string; purged?: number }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? (r.purged !== undefined ? `Caché purgada (${r.purged}).` : "Listo.") : (r.error ?? "Error"));
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <form
        action={(f) =>
          run(() => createLibraryEntry({ question: String(f.get("question")), answer: String(f.get("answer")) }))
        }
        className="grid gap-3 rounded-3xl border border-border/80 bg-surface p-5 shadow-soft"
      >
        <label className="label" htmlFor="question">Pregunta frecuente</label>
        <input id="question" name="question" required minLength={8} maxLength={300} placeholder="¿Qué es la gracia?" className="input" />
        <label className="label" htmlFor="answer">Respuesta revisada</label>
        <textarea id="answer" name="answer" required minLength={40} rows={6} className="input resize-y" placeholder="Distinguí texto bíblico (con cita), interpretación y aplicación." />
        <div className="flex flex-wrap gap-3">
          <button className={buttonClass("primary")} disabled={pending}>Guardar borrador</button>
          <button type="button" className={buttonClass("secondary")} disabled={pending} onClick={() => confirm("¿Purgar toda la caché por similitud?") && run(purgeAnswerCache)}>
            Purgar caché
          </button>
        </div>
        {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
      </form>

      <ul className="flex flex-col gap-3">
        {entries.map((e) => (
          <li key={e.id} className="rounded-2xl border border-border/80 bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={e.status === "published" ? "primary" : e.status === "approved" ? "accent" : "neutral"}>
                {LABEL[e.status] ?? e.status}
              </Badge>
              {e.retired && <Badge tone="danger">Retirada</Badge>}
              <span className="text-xs text-muted-foreground">{e.hits} usos{e.hasEmbedding ? " · similitud activa" : ""}</span>
            </div>
            <p className="mt-2 font-medium">{e.question}</p>
            <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{e.answer}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(NEXT[e.status] ?? []).map((n) => (
                <button key={n.to} disabled={pending} onClick={() => run(() => setLibraryStatus(e.id, n.to))} className={buttonClass("secondary", "px-3 py-1.5 text-xs")}>
                  {n.label}
                </button>
              ))}
              {e.status === "published" && (
                <button disabled={pending} onClick={() => run(() => retireLibraryEntry(e.id))} className={buttonClass("danger", "px-3 py-1.5 text-xs")}>
                  Retirar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
