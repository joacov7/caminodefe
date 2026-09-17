import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Perfil" };

export default function PerfilPage() {
  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu cuenta, tu plan y tu privacidad.
        </p>
      </header>

      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Iniciá sesión para ver y editar tu perfil.{" "}
        <Link href="/ingresar" className="font-medium text-primary hover:underline">
          Ingresar
        </Link>
      </p>

      <section className="grid grid-cols-1 gap-4">
        <Row title="Suscripción" desc="Plan Gratuito · Premium disponible (sin cobro en esta etapa)." />
        <Row title="Privacidad y consentimientos" desc="Controlá qué datos compartís y con quién." />
        <Row title="Notificaciones" desc="Recordatorios configurables, sin saturar." />
        <Row title="Eliminar historial y datos" desc="Podés borrar tus conversaciones y tu cuenta." />
      </section>
    </main>
  );
}

function Row({ title, desc }: { title: string; desc: string }) {
  return (
    <article className="rounded-2xl border border-border p-5">
      <h2 className="font-semibold text-primary">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </article>
  );
}
