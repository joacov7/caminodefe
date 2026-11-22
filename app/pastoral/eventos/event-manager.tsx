"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent, deleteEvent } from "@/server/events/actions";
import { buttonClass, Badge } from "@/components/ui";
import { IconPlus } from "@/components/icons";

export type ManagedEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  onlineUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  visibility: "public" | "members";
};

/** ISO → valor de <input type="datetime-local"> en la hora local del navegador. */
function toLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}
/** El navegador conoce la zona horaria de quien carga el evento. */
function fromLocal(v: string): string | "" {
  return v ? new Date(v).toISOString() : "";
}

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function EventManager({ churchId, events }: { churchId: string; events: ManagedEvent[] }) {
  const [editing, setEditing] = useState<ManagedEvent | "new" | null>(events.length === 0 ? "new" : null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const now = Date.now();

  function submit(form: FormData) {
    setError(null);
    const input = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      location: String(form.get("location") ?? ""),
      onlineUrl: String(form.get("onlineUrl") ?? ""),
      startsAt: fromLocal(String(form.get("startsAt") ?? "")),
      endsAt: fromLocal(String(form.get("endsAt") ?? "")),
      visibility: (form.get("visibility") === "members" ? "members" : "public") as "public" | "members",
    };
    start(async () => {
      const r = editing === "new" || !editing ? await createEvent(churchId, input) : await updateEvent(editing.id, input);
      if (!r.ok) setError(r.error);
      else {
        setEditing(null);
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    if (!confirm("¿Borrar este evento? No se puede deshacer.")) return;
    start(async () => {
      const r = await deleteEvent(id);
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  }

  const current = editing && editing !== "new" ? editing : null;

  return (
    <div className="flex flex-col gap-4">
      {editing ? (
        <form
          action={submit}
          className="grid gap-4 rounded-3xl border border-border/80 bg-surface p-5 shadow-soft sm:grid-cols-2"
          aria-label={current ? "Editar evento" : "Nuevo evento"}
        >
          <h3 className="font-serif text-lg font-semibold sm:col-span-2">{current ? "Editar evento" : "Nuevo evento"}</h3>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="title">Título</label>
            <input id="title" name="title" required minLength={3} maxLength={120} defaultValue={current?.title} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="startsAt">Inicio</label>
            <input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={toLocal(current?.startsAt ?? null)} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="endsAt">Fin <span className="font-normal text-muted-foreground">(opcional)</span></label>
            <input id="endsAt" name="endsAt" type="datetime-local" defaultValue={toLocal(current?.endsAt ?? null)} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="location">Lugar</label>
            <input id="location" name="location" maxLength={200} defaultValue={current?.location ?? ""} placeholder="Dirección o salón" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="onlineUrl">Transmisión <span className="font-normal text-muted-foreground">(opcional)</span></label>
            <input id="onlineUrl" name="onlineUrl" type="url" maxLength={500} defaultValue={current?.onlineUrl ?? ""} placeholder="https://…" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">Descripción</label>
            <textarea id="description" name="description" rows={3} maxLength={2000} defaultValue={current?.description ?? ""} className="input resize-y" />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="label">¿Quién lo ve?</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="visibility" value="public" defaultChecked={current?.visibility !== "members"} /> Público
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="visibility" value="members" defaultChecked={current?.visibility === "members"} /> Solo miembros
              </label>
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-danger sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={pending} className={buttonClass("primary")}>
              {pending ? "Guardando…" : current ? "Guardar cambios" : "Publicar evento"}
            </button>
            {events.length > 0 && (
              <button type="button" onClick={() => setEditing(null)} className={buttonClass("secondary")}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setEditing("new")} className={buttonClass("primary", "self-start")}>
          <IconPlus className="h-4 w-4" /> Nuevo evento
        </button>
      )}

      {error && !editing && <p role="alert" className="text-sm text-danger">{error}</p>}

      <ul className="flex flex-col gap-2">
        {events.map((e) => {
          const past = new Date(e.startsAt).getTime() < now;
          return (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface p-4">
              <div className="min-w-0">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">{fmt(e.startsAt)}</p>
                <div className="mt-1 flex gap-2">
                  <Badge tone={e.visibility === "public" ? "primary" : "accent"}>{e.visibility === "public" ? "Público" : "Miembros"}</Badge>
                  {past && <Badge>Pasado</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(e)} className={buttonClass("secondary", "px-4 py-2")}>
                  Editar
                </button>
                <button type="button" onClick={() => remove(e.id)} disabled={pending} className={buttonClass("danger")}>
                  Borrar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
