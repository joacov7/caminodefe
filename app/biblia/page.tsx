import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Biblia" };

export default function BibliaPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16">
      <header>
        <h1 className="text-3xl font-semibold">Biblia</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Versión inicial: Reina-Valera 1909 (dominio público). El lector por
          libro, capítulo y versículo se conecta a la base de datos en el Paso 2.
        </p>
      </header>

      <article className="rounded-2xl border border-border bg-muted/40 p-6">
        <p className="text-lg leading-relaxed">
          “Porque de tal manera amó Dios al mundo, que ha dado á su Hijo
          unigénito, para que todo aquel que en él cree, no se pierda, mas tenga
          vida eterna.”
        </p>
        <p className="mt-3 text-sm font-medium text-primary">Juan 3:16 (RVR1909)</p>
      </article>

      <p className="text-sm">
        <Link href="/" className="text-primary hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
