import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader, Card, Notice } from "@/components/ui";
import { IconArrowLeft, IconCheck } from "@/components/icons";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = {
  title: "Sumar mi iglesia",
  description: "Sumá tu iglesia a Camino de Fe gratis: perfil, horarios, eventos y bandeja pastoral.",
};
export const dynamic = "force-dynamic";

const BENEFITS = [
  "Perfil público con horarios, ubicación y lo que creen",
  "Eventos que aparecen en la agenda de Camino de Fe",
  "Bandeja para recibir pedidos de oración y visitantes",
  "Gestión de miembros, siempre respetando su privacidad",
];

export default async function SumarIglesiaPage() {
  const session = await auth().catch(() => null);
  return (
    <main className="flex flex-col gap-8">
      <nav className="text-sm">
        <Link href="/iglesias" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconArrowLeft className="h-4 w-4" /> Iglesias
        </Link>
      </nav>
      <PageHeader
        eyebrow="Para pastores y líderes"
        title="Sumá tu iglesia"
        description="Camino de Fe no reemplaza a la iglesia: le da herramientas para recibir y acompañar a más personas. El plan inicial es gratuito."
      />
      <Card>
        <ul className="grid gap-2 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {b}
            </li>
          ))}
        </ul>
      </Card>
      {session?.user?.id ? (
        <ApplyForm defaultEmail={session.user.email ?? ""} />
      ) : (
        <Notice>
          <Link href="/ingresar?callbackUrl=/iglesias/sumar" className="font-semibold text-primary hover:underline">
            Ingresá
          </Link>{" "}
          para enviar la solicitud. La revisa el equipo de Camino de Fe antes de publicarla.
        </Notice>
      )}
      <p className="text-xs text-muted-foreground">
        Verificación: confirmamos con la iglesia los datos de contacto y la persona responsable antes de publicar el
        perfil y otorgar permisos pastorales. Mientras tanto, la iglesia no aparece en el directorio.
      </p>
    </main>
  );
}
