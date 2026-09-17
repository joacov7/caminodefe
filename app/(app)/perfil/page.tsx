import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu cuenta, tu plan y tu privacidad.
        </p>
      </header>

      {user ? (
        <section className="flex items-center justify-between gap-4 rounded-2xl border border-border p-5">
          <div>
            <p className="font-medium">{user.name ?? "Tu cuenta"}</p>
            {user.email && (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            )}
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted"
            >
              Cerrar sesión
            </button>
          </form>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Iniciá sesión para ver y editar tu perfil.{" "}
          <Link href="/ingresar" className="font-medium text-primary hover:underline">
            Ingresar
          </Link>
        </p>
      )}

      <section className="grid grid-cols-1 gap-4">
        <Row
          href="/plan"
          title="Tu plan"
          desc="Plan Gratuito · Premium disponible (sin cobro en esta etapa)."
        />
        <Row
          href="/apoyar"
          title="Apoyá el proyecto"
          desc="Donación voluntaria para sostener Camino de Fe."
        />
        <Row title="Privacidad y consentimientos" desc="Controlá qué datos compartís y con quién." />
        <Row title="Notificaciones" desc="Recordatorios configurables, sin saturar." />
        <Row title="Eliminar historial y datos" desc="Podés borrar tus conversaciones y tu cuenta." />
      </section>
    </main>
  );
}

function Row({ title, desc, href }: { title: string; desc: string; href?: string }) {
  const inner = (
    <>
      <h2 className="font-semibold text-primary">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="rounded-2xl border border-border p-5 transition hover:bg-muted/50">
        {inner}
      </Link>
    );
  }
  return <article className="rounded-2xl border border-border p-5">{inner}</article>;
}
