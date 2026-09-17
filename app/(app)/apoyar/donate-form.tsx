"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordDonation } from "@/server/billing/actions";
import { SUGGESTED_AMOUNTS_MINOR, type ContributionType } from "@/server/billing/donations";
import { formatAmount } from "@/server/billing/plans";

const DESTINATIONS: { value: ContributionType; label: string }[] = [
  { value: "platform", label: "Sostener Camino de Fe" },
  { value: "mission", label: "Colaboración con una misión" },
];

export function DonateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<ContributionType>("platform");
  const [amountMinor, setAmountMinor] = useState<number>(SUGGESTED_AMOUNTS_MINOR[1]!);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const finalAmount = custom
      ? Math.round(parseFloat(custom.replace(",", ".")) * 100)
      : amountMinor;
    if (!finalAmount || finalAmount <= 0) {
      setError("Ingresá un monto mayor a cero.");
      return;
    }
    startTransition(async () => {
      const res = await recordDonation({
        type,
        amountMinor: finalAmount,
        currency: "ARS",
        note: note || undefined,
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (done) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-primary/40 bg-primary/10 p-6 text-sm"
      >
        ¡Gracias! Registramos tu intención de aporte. Te contactaremos para
        coordinar el medio de pago cuando esté habilitado. Podés ver el estado más
        abajo.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-border p-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="dest" className="text-sm font-medium">
          Destino
        </label>
        <select
          id="dest"
          value={type}
          onChange={(e) => setType(e.target.value as ContributionType)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          {DESTINATIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Monto</span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_AMOUNTS_MINOR.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => {
                setAmountMinor(a);
                setCustom("");
              }}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                !custom && amountMinor === a
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {formatAmount(a)}
            </button>
          ))}
        </div>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          inputMode="decimal"
          placeholder="Otro monto (ARS)"
          aria-label="Otro monto"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="note" className="text-sm font-medium">
          Mensaje (opcional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-muted-foreground">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Registrar mi aporte"}
      </button>
    </form>
  );
}
