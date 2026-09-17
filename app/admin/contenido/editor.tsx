"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPlatformContent, setContentStatus } from "@/server/content/actions";
import {
  STATUS_LABELS,
  ORIGIN_LABELS,
  canTransition,
  type EditorialStatus,
  type ContentOrigin,
} from "@/server/content/editorial";

type Item = {
  id: string;
  type: string;
  title: string;
  origin: string;
  status: string;
};

const NEXT_ACTIONS: { label: string; to: EditorialStatus }[] = [
  { label: "Enviar a revisión", to: "review" },
  { label: "Aprobar", to: "approved" },
  { label: "Publicar", to: "published" },
];

export function ContentEditor({ items, dbReady }: { items: Item[]; dbReady: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Formulario de creación.
  const [type, setType] = useState("devotional");
  const [title, setTitle] = useState("");
  const [passage, setPassage] = useState("");
  const [objective, setObjective] = useState("");
  const [body, setBody] = useState("");
  const [origin, setOrigin] = useState("human");

  function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createPlatformContent({
        type: type as never,
        title,
        passage: passage || undefined,
        objective: objective || undefined,
        body,
        origin: origin as never,
      });
      if (res.ok) {
        setTitle("");
        setPassage("");
        setObjective("");
        setBody("");
        router.refresh();
      } else setError(res.error);
    });
  }

  function advance(id: string, to: EditorialStatus) {
    setError(null);
    startTransition(async () => {
      const res = await setContentStatus(id, to);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-muted-foreground">{error}</p>}

      <form onSubmit={create} className="flex flex-col gap-3 rounded-2xl border border-border p-5">
        <h2 className="font-semibold">Nuevo contenido</h2>
        <div className="grid grid-cols-2 gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="devotional">Devocional</option>
            <option value="study">Estudio</option>
            <option value="plan">Plan de lectura</option>
            <option value="group">Material para grupos</option>
          </select>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="human">Revisado por una persona</option>
            <option value="ai">Generado por IA</option>
            <option value="church">Aprobado por una iglesia</option>
          </select>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Título" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <input value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Pasaje (opcional, ej. Juan 3:16)" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Objetivo (opcional)" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={5} placeholder="Contenido…" className="resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        <button type="submit" disabled={pending || !dbReady} className="self-start rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          Crear borrador
        </button>
        {!dbReady && <p className="text-xs text-muted-foreground">Base de datos no configurada.</p>}
      </form>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
          Contenidos ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin contenidos todavía.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((it) => (
              <li key={it.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{it.title}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {STATUS_LABELS[it.status as EditorialStatus] ?? it.status}
                  </span>
                </div>
                <p className="text-xs text-primary">
                  {ORIGIN_LABELS[it.origin as ContentOrigin]}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {NEXT_ACTIONS.filter((a) =>
                    canTransition(it.status as EditorialStatus, a.to),
                  ).map((a) => (
                    <button
                      key={a.to}
                      onClick={() => advance(it.id, a.to)}
                      disabled={pending}
                      className="rounded-full border border-border px-3 py-1 text-xs transition hover:bg-muted disabled:opacity-50"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
