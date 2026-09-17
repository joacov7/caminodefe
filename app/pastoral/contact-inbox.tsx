"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateContactStatus } from "@/server/churches/actions";
import type { ContactStatus } from "@/server/churches/contact";

type Req = {
  id: string;
  reason: string;
  message: string | null;
  status: string;
  createdAt: string;
};

const REASON_LABELS: Record<string, string> = {
  oracion: "Pedido de oración",
  acompanamiento: "Acompañamiento",
  consulta_biblica: "Consulta bíblica",
  quiero_congregar: "Quiere congregar",
  otro: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Nueva",
  received: "Recibida",
  in_progress: "En curso",
  resolved: "Resuelta",
  withdrawn: "Retirada",
};

// Próximo estado que la iglesia puede fijar desde el actual (UI espejo de la
// máquina de estados del servidor, que es la que autoriza de verdad).
const NEXT: Record<string, { label: string; next: ContactStatus }[]> = {
  sent: [{ label: "Marcar recibida", next: "received" }],
  received: [
    { label: "Tomar", next: "in_progress" },
    { label: "Resolver", next: "resolved" },
  ],
  in_progress: [{ label: "Resolver", next: "resolved" }],
};

export function ContactInbox({ requests }: { requests: Req[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin solicitudes.</p>;
  }

  function act(id: string, next: ContactStatus) {
    setError(null);
    startTransition(async () => {
      const res = await updateContactStatus(id, next);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-muted-foreground">
          {error}
        </p>
      )}
      {requests.map((r) => (
        <article key={r.id} className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {REASON_LABELS[r.reason] ?? r.reason}
            </p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {STATUS_LABELS[r.status] ?? r.status}
            </span>
          </div>
          {r.message && (
            <p className="mt-1 text-sm text-muted-foreground">{r.message}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {(NEXT[r.status] ?? []).map((opt) => (
              <button
                key={opt.next}
                onClick={() => act(r.id, opt.next)}
                disabled={pending}
                className="rounded-full border border-border px-3 py-1 text-xs transition hover:bg-muted disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
