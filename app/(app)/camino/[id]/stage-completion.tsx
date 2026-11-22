"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { completeStage, uncompleteStage } from "@/server/journey/actions";
import { buttonClass } from "@/components/ui";
import { IconCheck, IconShield } from "@/components/icons";

export function StageCompletion({
  stageId,
  signedIn,
  completed,
  initialReflection,
  nextHref,
}: {
  stageId: string;
  signedIn: boolean;
  completed: boolean;
  initialReflection: string;
  nextHref: string;
}) {
  const [reflection, setReflection] = useState(initialReflection);
  const [done, setDone] = useState(completed);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  if (!signedIn) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-5 text-sm">
        <p>
          <Link href={`/ingresar?callbackUrl=/camino/${stageId}`} className="font-semibold text-primary hover:underline">
            Ingresá
          </Link>{" "}
          para marcar esta etapa y guardar tu reflexión. Es gratis y privado.
        </p>
      </div>
    );
  }

  function save(markDone: boolean) {
    setError(null);
    setSaved(false);
    start(async () => {
      const r = markDone ? await completeStage(stageId, reflection) : await uncompleteStage(stageId);
      if (!r.ok) setError(r.error);
      else {
        setDone(markDone);
        setSaved(true);
      }
    });
  }

  return (
    <section aria-label="Guardar tu progreso" className="rounded-3xl border border-border/80 bg-surface p-5 shadow-soft">
      <label htmlFor="reflexion" className="label">
        Tu reflexión <span className="font-normal text-muted-foreground">(opcional)</span>
      </label>
      <textarea
        id="reflexion"
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder="Escribí lo que pensaste o sentiste…"
        className="input resize-y"
      />
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconShield className="h-3.5 w-3.5" /> Privado: nadie más puede leerlo, ni tu pastor ni el equipo.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {done ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <IconCheck className="h-4 w-4" /> Etapa recorrida
            </span>
            <button type="button" disabled={pending} onClick={() => save(true)} className={buttonClass("secondary")}>
              Guardar reflexión
            </button>
            <Link href={nextHref} className={buttonClass("primary")}>
              Siguiente
            </Link>
            <button type="button" disabled={pending} onClick={() => save(false)} className={buttonClass("ghost")}>
              Desmarcar
            </button>
          </>
        ) : (
          <button type="button" disabled={pending} onClick={() => save(true)} className={buttonClass("primary")}>
            {pending ? "Guardando…" : "Marcar como recorrida"}
          </button>
        )}
        {saved && !pending && <span className="text-sm text-muted-foreground">Guardado.</span>}
      </div>
    </section>
  );
}
