"use client";

import { useState } from "react";

/**
 * Composer del asistente. La interfaz existe, pero el envío real al modelo se
 * conecta en el Paso 3 (adapter de OpenAI + RAG). No simulamos respuestas.
 */
export function Composer() {
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setNotice(
      "El asistente todavía no está conectado (Paso 3). Se habilita al " +
        "configurar OPENAI_API_KEY y el pipeline RAG con verificación de citas.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
        >
          {notice}
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
          disabled={!value.trim()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition enabled:hover:opacity-90 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        Ante una situación de riesgo o crisis, buscá ayuda humana. El asistente
        puede orientarte hacia recursos, pero no reemplaza servicios
        profesionales ni al acompañamiento pastoral.
      </p>
    </form>
  );
}
