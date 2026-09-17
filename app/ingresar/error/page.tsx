import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Error de ingreso" };

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">No pudimos ingresarte</h1>
      <p className="text-sm text-muted-foreground">
        El enlace puede haber expirado o ya haber sido usado. Probá pedir uno
        nuevo.
      </p>
      <p className="text-sm">
        <Link href="/ingresar" className="text-primary hover:underline">
          Volver a intentar
        </Link>
      </p>
    </main>
  );
}
