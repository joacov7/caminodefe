import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Inicio" };

export default function InicioPage() {
  return (
    <main className="flex flex-col gap-8">
      <header>
        <p className="text-sm text-muted-foreground">Que tengas un buen día</p>
        <h1 className="text-2xl font-semibold">Bienvenido/a a Camino de Fe</h1>
      </header>

      <section aria-label="Versículo del día" className="rounded-2xl border border-border bg-muted/40 p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          Versículo del día
        </p>
        <p className="mt-2 text-lg leading-relaxed">
          “Jehová es mi pastor; nada me faltará.”
        </p>
        <Link
          href="/biblia/salmos/23"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Salmos 23:1 (RVR1909) →
        </Link>
      </section>

      <section aria-label="Accesos rápidos" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <QuickCard
          href="/asistente"
          title="Preguntá al asistente"
          desc="Consultá sobre la Biblia en tus palabras."
        />
        <QuickCard
          href="/biblia"
          title="Leer la Biblia"
          desc="Reina-Valera 1909 · por libro y capítulo."
        />
        <QuickCard
          href="/mi-camino"
          title="Mi Camino"
          desc="Tus notas, progreso y oración."
        />
        <QuickCard
          href="/iglesias"
          title="Encontrar una iglesia"
          desc="Conectá con una comunidad local."
        />
      </section>
    </main>
  );
}

function QuickCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border p-5 transition hover:bg-muted/50"
    >
      <h2 className="font-semibold text-primary">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
