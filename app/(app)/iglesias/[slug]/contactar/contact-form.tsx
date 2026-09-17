"use client";

import { useState } from "react";
import { createContactRequest } from "@/server/churches/actions";

const REASONS: { value: string; label: string }[] = [
  { value: "oracion", label: "Pedido de oración" },
  { value: "acompanamiento", label: "Acompañamiento personal" },
  { value: "consulta_biblica", label: "Consulta bíblica" },
  { value: "quiero_congregar", label: "Quiero congregar / conocer la iglesia" },
  { value: "otro", label: "Otro" },
];

export function ContactForm({ churchId }: { churchId: string }) {
  const [reason, setReason] = useState(REASONS[0]!.value);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const res = await createContactRequest({ churchId, reason, message });
    if (res.ok) {
      setState("sent");
    } else {
      setError(res.error);
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-primary/40 bg-primary/10 p-6 text-sm"
      >
        Tu solicitud fue enviada. Podrás ver su estado y retirarla desde tu perfil.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="reason" className="text-sm font-medium">
          Motivo
        </label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-medium">
          Mensaje (opcional)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Contanos brevemente en qué podemos ayudarte…"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Compartí solo lo que quieras. No incluyas datos sensibles que no sean
          necesarios.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-muted-foreground">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="self-start rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition enabled:hover:opacity-90 disabled:opacity-50"
      >
        {state === "sending" ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
