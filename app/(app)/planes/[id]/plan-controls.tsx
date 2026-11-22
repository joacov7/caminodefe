"use client";

import { useOptimistic, useTransition } from "react";
import { setPlanDay, resetPlan } from "@/server/journey/actions";
import { IconCheck } from "@/components/icons";

export function DayToggle({ planId, day, done }: { planId: string; day: number; done: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(done);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? `Desmarcar día ${day}` : `Marcar día ${day} como leído`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          await setPlanDay(planId, day, !optimistic);
        })
      }
      className={[
        "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition active:scale-95",
        optimistic
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary",
      ].join(" ")}
    >
      {optimistic ? <IconCheck className="h-4 w-4" /> : day}
    </button>
  );
}

export function ResetPlan({ planId }: { planId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Reiniciar el plan? Se borrará tu avance en este plan.")) start(() => resetPlan(planId).then(() => undefined));
      }}
      className="mt-3 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
    >
      Reiniciar plan
    </button>
  );
}
