"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPrayerAnswered, deletePrayer } from "@/server/prayer/actions";
import { PRAYER_STATUS_LABELS } from "@/server/prayer/validation";
import { Badge, buttonClass } from "@/components/ui";

type Prayer = {
  id: string;
  body: string;
  scope: string;
  anonymous: boolean;
  status: string;
  answerNote: string | null;
  createdAt: string;
  churchName: string | null;
};

export function PrayerItem({ prayer }: { prayer: Prayer }) {
  const [answering, setAnswering] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const date = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(new Date(prayer.createdAt));

  return (
    <li className="rounded-3xl border border-border/80 bg-surface p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{date}</span>
        {prayer.scope === "church" && prayer.churchName ? (
          <Badge tone="primary">{prayer.churchName}{prayer.anonymous ? " · sin nombre" : ""}</Badge>
        ) : (
          <Badge>Privado</Badge>
        )}
        {prayer.status !== "open" && (
          <Badge tone={prayer.status === "answered" ? "accent" : "primary"}>{PRAYER_STATUS_LABELS[prayer.status]}</Badge>
        )}
      </div>
      <p className="mt-2 whitespace-pre-line leading-relaxed">{prayer.body}</p>
      {prayer.answerNote && (
        <p className="mt-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm">
          <span className="font-semibold">Cómo respondió Dios: </span>
          {prayer.answerNote}
        </p>
      )}
      {answering ? (
        <div className="mt-3 flex flex-col gap-2">
          <label htmlFor={`nota-${prayer.id}`} className="label">¿Querés anotar cómo respondió? (opcional)</label>
          <textarea id={`nota-${prayer.id}`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} className="input" />
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={() => start(async () => { await markPrayerAnswered(prayer.id, note); router.refresh(); })}
              className={buttonClass("primary", "px-4 py-2")}
            >
              Guardar
            </button>
            <button onClick={() => setAnswering(false)} className={buttonClass("ghost")}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-3 text-sm">
          {prayer.status !== "answered" && (
            <button onClick={() => setAnswering(true)} className="font-medium text-primary hover:underline">
              Dios respondió
            </button>
          )}
          <button
            disabled={pending}
            onClick={() => confirm("¿Borrar este pedido?") && start(async () => { await deletePrayer(prayer.id); router.refresh(); })}
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Borrar
          </button>
        </div>
      )}
    </li>
  );
}
