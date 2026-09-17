import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ingresar" };

export default function IngresarPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Ingresar a Camino de Fe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El inicio de sesión con Google y por correo se habilita al configurar
          las credenciales de Auth.js (ver <code>.env.example</code>).
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Próximamente: acceso con Google y enlace mágico por correo.
      </div>

      <p className="text-center text-sm">
        <Link href="/" className="text-primary hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
