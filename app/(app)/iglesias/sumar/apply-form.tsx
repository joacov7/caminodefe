"use client";

import { useState, useTransition } from "react";
import { applyChurch } from "@/server/churches/membership";
import { buttonClass } from "@/components/ui";

export function ApplyForm({ defaultEmail }: { defaultEmail: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit(f: FormData) {
    setError(null);
    start(async () => {
      const r = await applyChurch({
        name: String(f.get("name") ?? ""),
        generalLocation: String(f.get("generalLocation") ?? ""),
        description: String(f.get("description") ?? ""),
        doctrinalStatement: String(f.get("doctrinalStatement") ?? ""),
        website: String(f.get("website") ?? ""),
        contactEmail: String(f.get("contactEmail") ?? ""),
        contactPhone: String(f.get("contactPhone") ?? ""),
        role: (String(f.get("role") ?? "pastor") as "pastor" | "church_leader" | "church_admin"),
        acceptTerms: f.get("acceptTerms") === "on",
      });
      if (r.ok) setDone(true);
      else setError(r.error);
    });
  }

  if (done) {
    return (
      <div role="status" className="rounded-3xl bg-primary-soft p-6">
        <p className="font-serif text-xl font-semibold text-primary">¡Gracias! Recibimos la solicitud.</p>
        <p className="mt-2 text-sm">
          El equipo la revisará y se comunicará al correo indicado. Cuando la iglesia esté verificada, vas a ver el
          «Panel pastoral» en tu perfil.
        </p>
      </div>
    );
  }

  return (
    <form action={submit} className="grid gap-4 rounded-3xl border border-border/80 bg-surface p-5 shadow-soft sm:grid-cols-2 sm:p-6">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="name">Nombre de la iglesia</label>
        <input id="name" name="name" required minLength={3} maxLength={120} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="generalLocation">Ciudad / barrio</label>
        <input id="generalLocation" name="generalLocation" required maxLength={120} placeholder="Ej.: Rosario, Santa Fe" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="role">Tu rol</label>
        <select id="role" name="role" className="input" defaultValue="pastor">
          <option value="pastor">Pastor/a</option>
          <option value="church_leader">Líder</option>
          <option value="church_admin">Administración de la iglesia</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="description">Presentación</label>
        <textarea id="description" name="description" rows={3} maxLength={1500} placeholder="Quiénes son, cómo es una reunión, a quién quieren recibir…" className="input resize-y" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="doctrinalStatement">Declaración de fe <span className="font-normal text-muted-foreground">(opcional)</span></label>
        <textarea id="doctrinalStatement" name="doctrinalStatement" rows={3} maxLength={3000} className="input resize-y" />
      </div>
      <div>
        <label className="label" htmlFor="contactEmail">Correo de contacto</label>
        <input id="contactEmail" name="contactEmail" type="email" required defaultValue={defaultEmail} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="contactPhone">Teléfono <span className="font-normal text-muted-foreground">(opcional)</span></label>
        <input id="contactPhone" name="contactPhone" maxLength={40} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="website">Sitio web o red social <span className="font-normal text-muted-foreground">(opcional)</span></label>
        <input id="website" name="website" type="url" placeholder="https://…" className="input" />
      </div>
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="acceptTerms" required className="mt-1" />
        Confirmo que formo parte del equipo de esta iglesia y que los datos son correctos.
      </label>
      {error && <p role="alert" className="text-sm text-danger sm:col-span-2">{error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary", "sm:col-span-2 sm:justify-self-start")}>
        {pending ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
