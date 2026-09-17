import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Revisá tu correo" };

export default function VerificarPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Revisá tu correo</h1>
      <p className="text-sm text-muted-foreground">
        Te enviamos un enlace de acceso. Abrilo desde este dispositivo para
        ingresar. Si no lo ves, revisá la carpeta de spam.
      </p>
      <p className="text-sm">
        <Link href="/ingresar" className="text-primary hover:underline">
          Volver
        </Link>
      </p>
    </main>
  );
}
