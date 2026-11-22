"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setChurchStatus, setChurchPlan } from "@/server/churches/actions";
import { CHURCH_PLANS } from "@/server/billing/church-plans";

type Church = {
  id: string;
  name: string;
  status: string;
  location: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  requester?: string | null;
  requestedRole?: string | null;
  plan?: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  verified: "Verificada",
  rejected: "Rechazada",
  suspended: "Suspendida",
};

export function VerificationRow({ church }: { church: Church }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set(status: "verified" | "rejected" | "suspended" | "pending") {
    setError(null);
    startTransition(async () => {
      const res = await setChurchStatus(church.id, status);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <li className="rounded-2xl border border-border/80 bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium">{church.name}</p>
          {(church.contactEmail || church.requester) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {church.requester && <>Solicitó: {church.requester}{church.requestedRole ? ` · rol: ${church.requestedRole}` : ""}<br /></>}
              {church.contactEmail && <>Contacto: {church.contactEmail}{church.contactPhone ? ` · ${church.contactPhone}` : ""}</>}
            </p>
          )}
          {church.location && (
            <p className="text-xs text-muted-foreground">{church.location}</p>
          )}
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {STATUS_LABELS[church.status] ?? church.status}
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-muted-foreground">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => set("verified")}
          disabled={pending || church.status === "verified"}
          className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-40"
        >
          Verificar
        </button>
        <button
          onClick={() => set("rejected")}
          disabled={pending || church.status === "rejected"}
          className="rounded-full border border-border px-3 py-1 text-xs disabled:opacity-40"
        >
          Rechazar
        </button>
        <button
          onClick={() => set("suspended")}
          disabled={pending || church.status === "suspended"}
          className="rounded-full border border-border px-3 py-1 text-xs disabled:opacity-40"
        >
          Suspender
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          Plan
          <select
            value={church.plan ?? "free"}
            disabled={pending}
            onChange={(e) =>
              startTransition(async () => {
                const r = await setChurchPlan(church.id, e.target.value);
                if (r.ok) router.refresh();
                else setError(r.error);
              })
            }
            className="rounded-full border border-border bg-surface px-2 py-1 text-xs"
          >
            {Object.values(CHURCH_PLANS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </li>
  );
}
