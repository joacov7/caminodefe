"use client";

import { useState, useTransition } from "react";
import { saveReminderPrefs } from "@/server/journey/actions";
import { buttonClass } from "@/components/ui";
import { IconCalendar } from "@/components/icons";

const DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

type Prefs = { enabled: boolean; time: string; days: number[]; timezone: string };

export function ReminderForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(() => ({
    ...initial,
    timezone: initial.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }));
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggleDay = (d: number) =>
    setPrefs((p) => ({ ...p, days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d].sort() }));

  function save() {
    setMsg(null);
    start(async () => {
      const r = await saveReminderPrefs(prefs);
      setMsg(r.ok ? "Guardado." : r.error);
    });
  }

  const icsHref = `/api/recordatorio?time=${encodeURIComponent(prefs.time)}&days=${prefs.days.join(",")}&tz=${encodeURIComponent(prefs.timezone)}`;

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border/80 bg-surface p-5 shadow-soft sm:p-6">
      <div>
        <label htmlFor="time" className="label">Hora</label>
        <input
          id="time"
          type="time"
          value={prefs.time}
          onChange={(e) => setPrefs((p) => ({ ...p, time: e.target.value }))}
          className="input max-w-[10rem] text-lg"
        />
      </div>
      <fieldset>
        <legend className="label">Días</legend>
        <div className="flex gap-2">
          {DAYS.map((d, i) => {
            const on = prefs.days.includes(i);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                aria-label={DAY_NAMES[i]}
                onClick={() => toggleDay(i)}
                className={[
                  "grid h-10 w-10 place-items-center rounded-full text-sm font-semibold transition",
                  on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-border",
                ].join(" ")}
              >
                {d}
              </button>
            );
          })}
        </div>
      </fieldset>
      <p className="text-xs text-muted-foreground">Zona horaria: {prefs.timezone}</p>
      {msg && <p role="status" className="text-sm">{msg}</p>}
      <div className="flex flex-wrap gap-3">
        <a
          href={prefs.days.length ? icsHref : undefined}
          aria-disabled={!prefs.days.length}
          onClick={save}
          className={buttonClass("primary", !prefs.days.length ? "pointer-events-none opacity-50" : "")}
        >
          <IconCalendar className="h-4 w-4" /> Agregar a mi calendario
        </a>
        <button type="button" disabled={pending} onClick={save} className={buttonClass("secondary")}>
          Solo guardar
        </button>
      </div>
    </div>
  );
}
