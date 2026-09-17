"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { activatePremium, cancelPremium } from "@/server/billing/actions";

export function PlanActions({ isPremium }: { isPremium: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error ?? "Error.");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-muted-foreground">{error}</p>}
      {isPremium ? (
        <button
          onClick={() => run(cancelPremium)}
          disabled={pending}
          className="self-start rounded-full border border-border px-5 py-2.5 text-sm transition hover:bg-muted disabled:opacity-50"
        >
          Volver al plan gratuito
        </button>
      ) : (
        <button
          onClick={() => run(activatePremium)}
          disabled={pending}
          className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          Activar Premium (sin cargo en esta etapa)
        </button>
      )}
    </div>
  );
}
