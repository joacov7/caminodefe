import type { Metadata } from "next";
import Link from "next/link";
import { Composer } from "./composer";

export const metadata: Metadata = { title: "Asistente" };

const ejemplos = [
  "¿Qué enseña la Biblia sobre el perdón?",
  "Explicame Romanos 8.",
  "Quiero empezar a leer la Biblia.",
  "¿Cómo puedo orar por mi familia?",
];

export default function AsistentePage() {
  return (
    <main className="flex min-h-[70dvh] flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Asistente bíblico</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Una herramienta de orientación y estudio. Distingue el texto bíblico
            de su interpretación y no sustituye el acompañamiento pastoral.
          </p>
        </div>
        <Link
          href="/asistente/historial"
          className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-muted"
        >
          Historial
        </Link>
      </header>

      <section aria-label="Ejemplos" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ejemplos.map((e) => (
          <div
            key={e}
            className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
          >
            {e}
          </div>
        ))}
      </section>

      <div className="mt-auto">
        <Composer />
      </div>
    </main>
  );
}
