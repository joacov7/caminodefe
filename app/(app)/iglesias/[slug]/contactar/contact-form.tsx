"use client";

import { useState } from "react";
import Link from "next/link";
import { createContactRequest } from "@/server/churches/actions";
import { buttonClass } from "@/components/ui";
import { IconShield } from "@/components/icons";

const REASONS: { value: string; label: string }[] = [
  { value: "oracion", label: "Pedido de oración" },
  { value: "acompanamiento", label: "Acompañamiento personal" },
  { value: "consulta_biblica", label: "Consulta bíblica" },
  { value: "quiero_congregar", label: "Quiero visitar / conocer la iglesia" },
  { value: "otro", label: "Otro" },
];

export function ContactForm({
  churchId,
  churchName,
  signedIn,
  initialReason,
  initialMessage,
  callbackUrl,
}: {
  churchId: string;
  churchName: string;
  signedIn: boolean;
  initialReason: string;
  initialMessage: string;
  callbackUrl: string;
}) {
  const [reason, setReason] = useState(initialReason);
  const [message, setMessage] = useState(initialMessage);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-6 text-sm">
        Para que el pastor pueda responderte necesitás una cuenta.{" "}
        <Link href={`/ingresar?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-primary hover:underline">
          Ingresá o creá tu cuenta
        </Link>{" "}
        (es gratis).
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const res = await createContactRequest({ churchId, reason, message });
    if (res.ok) setState("sent");
    else {
      setError(res.error);
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-3xl bg-primary-soft p-6">
        <p className="font-serif text-xl font-semibold text-primary">¡Listo! Tu mensaje llegó a {churchName}.</p>
        <p className="mt-2 text-sm text-foreground/80">
          Podés ver el estado y retirarlo cuando quieras desde{" "}
          <Link href="/perfil" className="font-medium text-primary hover:underline">tu perfil</Link>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-3xl border border-border/80 bg-surface p-5 shadow-soft sm:p-6">
      <fieldset>
        <legend className="label">¿En qué te pueden ayudar?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={[
                "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                reason === r.value ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-muted",
              ].join(" ")}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-[hsl(var(--primary))]"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="message" className="label">
          Mensaje <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Contá brevemente en qué podemos ayudarte…"
          className="input resize-y"
        />
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <IconShield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Solo lo recibe el equipo pastoral de {churchName}. Compartí únicamente lo que quieras.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={state === "sending"} className={buttonClass("primary", "self-start")}>
        {state === "sending" ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}
