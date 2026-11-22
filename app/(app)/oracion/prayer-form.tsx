"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPrayer } from "@/server/prayer/actions";
import { buttonClass } from "@/components/ui";
import { IconShield } from "@/components/icons";

export function PrayerForm({ churches }: { churches: { id: string; name: string }[] }) {
  const [body, setBody] = useState("");
  const [share, setShare] = useState(false);
  const [churchId, setChurchId] = useState(churches[0]?.id ?? "");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const target = churches.find((c) => c.id === churchId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const submitted = body;
    start(async () => {
      const r = await createPrayer({
        body,
        scope: share ? "church" : "private",
        churchId: share ? churchId : null,
        anonymous,
      });
      if (!r.ok) setError(r.error);
      else {
        // Solo se limpia si la persona no empezó a escribir otro pedido mientras
        // se guardaba (evita perder texto).
        setBody((cur) => (cur === submitted ? "" : cur));
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-surface p-5 shadow-soft sm:p-6">
      <div>
        <label htmlFor="pedido" className="label">¿Por qué querés orar?</label>
        <textarea
          id="pedido"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={2000}
          required
          placeholder="Por mi familia, por mi trabajo, por alguien que quiero…"
          className="input resize-y"
        />
      </div>

      {churches.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="label">¿Quién lo ve?</legend>
          <label className="flex items-start gap-3 text-sm">
            <input type="radio" name="scope" checked={!share} onChange={() => setShare(false)} className="mt-1" />
            <span>
              <span className="font-medium">Solo yo</span>
              <span className="block text-muted-foreground">Queda en tu diario de oración.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="radio" name="scope" checked={share} onChange={() => setShare(true)} className="mt-1" />
            <span>
              <span className="font-medium">Pedirle a mi iglesia que ore</span>
              <span className="block text-muted-foreground">Lo ve solo el equipo pastoral, no otros miembros.</span>
            </span>
          </label>
          {share && (
            <div className="ml-7 flex flex-col gap-3">
              {churches.length > 1 && (
                <select value={churchId} onChange={(e) => setChurchId(e.target.value)} className="input max-w-xs" aria-label="Iglesia">
                  {churches.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                Compartir sin mi nombre
              </label>
            </div>
          )}
        </fieldset>
      )}

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <IconShield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {share && target
          ? `Lo verá el equipo pastoral de ${target.name}${anonymous ? ", sin tu nombre" : ", con tu nombre"}. Podés borrarlo cuando quieras.`
          : "Privado: nadie más puede leerlo, ni tu pastor ni el equipo de Camino de Fe."}
      </p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={pending || body.trim().length < 3} className={buttonClass("primary", "self-start")}>
        {pending ? "Guardando…" : share ? "Compartir pedido" : "Guardar pedido"}
      </button>
    </form>
  );
}
