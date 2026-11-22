import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/app-nav";

export const metadata: Metadata = { title: "Sin conexión" };

/** Página que el service worker muestra cuando no hay red y no hay copia guardada. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo className="h-14 w-14" />
      <h1 className="font-serif text-3xl font-semibold">Estás sin conexión</h1>
      <p className="text-muted-foreground">
        Los capítulos de la Biblia y las etapas del camino que ya abriste siguen disponibles. Cuando vuelva la conexión,
        todo se actualiza solo.
      </p>
      <blockquote className="font-serif text-lg italic text-foreground/80">
        “Lámpara es á mis pies tu palabra, y lumbrera á mi camino.” <span className="not-italic">— Salmos 119:105</span>
      </blockquote>
      <Link href="/biblia" className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">
        Ir a la Biblia
      </Link>
    </main>
  );
}
