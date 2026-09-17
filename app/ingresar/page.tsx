import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, enabledAuthMethods } from "@/lib/auth";
import { googleSignIn, emailSignIn } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "Ingresar" };
export const dynamic = "force-dynamic";

export default async function IngresarPage() {
  const session = await auth();
  if (session?.user) redirect("/inicio");

  const methods = enabledAuthMethods();
  const anyMethod = methods.google || methods.email;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Ingresar a Camino de Fe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accedé para usar el asistente, guardar tu camino y conectar con tu
          iglesia.
        </p>
      </div>

      {!anyMethod && (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          El inicio de sesión se habilita al configurar las credenciales
          (Google y/o correo). Ver <code>.env.example</code>.
        </p>
      )}

      {methods.google && (
        <form action={googleSignIn}>
          <button
            type="submit"
            className="w-full rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted"
          >
            Continuar con Google
          </button>
        </form>
      )}

      {methods.google && methods.email && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
        </div>
      )}

      {methods.email && (
        <form action={emailSignIn} className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Ingresar con tu correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@correo.com"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Enviarme un enlace
          </button>
          <p className="text-xs text-muted-foreground">
            Te enviamos un enlace de acceso. No usamos contraseñas.
          </p>
        </form>
      )}

      <p className="text-center text-sm">
        <Link href="/" className="text-primary hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
