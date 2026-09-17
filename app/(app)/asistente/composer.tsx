"use client";

import { useState } from "react";

type Citation = { ref: string; verified: boolean };
type Turn = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  crisis?: boolean;
};

export function Composer() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = value.trim();
    if (!question || loading) return;

    setError(null);
    setValue("");
    const history: Turn[] = [...turns, { role: "user", content: question }];
    setTurns(history);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((t) => ({ role: t.role, content: t.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "No se pudo obtener respuesta.");
        return;
      }
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.text,
          citations: data.citations,
          crisis: data.flag === "crisis",
        },
      ]);
    } catch {
      setError("Error de conexión con el asistente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {turns.length > 0 && (
        <ol className="flex flex-col gap-3" aria-label="Conversación">
          {turns.map((t, i) => (
            <li
              key={i}
              className={
                t.role === "user"
                  ? "self-end rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground"
                  : `rounded-2xl border px-4 py-3 text-sm ${
                      t.crisis
                        ? "border-accent bg-accent/10"
                        : "border-border bg-muted/40"
                    }`
              }
            >
              <p className="whitespace-pre-wrap leading-relaxed">{t.content}</p>
              {t.citations && t.citations.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {t.citations.map((c, j) => (
                    <li
                      key={j}
                      title={
                        c.verified
                          ? "Referencia verificada contra el texto bíblico"
                          : "Referencia no verificada"
                      }
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        c.verified
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground line-through"
                      }`}
                    >
                      {c.ref} {c.verified ? "✓" : "?"}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
          >
            {error}
          </p>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2">
          <label htmlFor="pregunta" className="sr-only">
            Escribí tu pregunta
          </label>
          <textarea
            id="pregunta"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={2}
            placeholder="Escribí tu pregunta sobre la Biblia…"
            className="flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!value.trim() || loading}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition enabled:hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "…" : "Enviar"}
          </button>
        </div>
        <p className="px-1 text-xs text-muted-foreground">
          Ante una situación de riesgo o crisis, buscá ayuda humana. El asistente
          puede orientarte hacia recursos, pero no reemplaza servicios
          profesionales ni al acompañamiento pastoral.
        </p>
      </form>
    </div>
  );
}
