import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader, Card, ButtonLink, SectionTitle } from "@/components/ui";
import { IconArrowLeft, IconDownload, IconShield } from "@/components/icons";
import { DeleteAccount } from "./delete-account";

export const metadata: Metadata = { title: "Privacidad y datos" };
export const dynamic = "force-dynamic";

const PRIVATE = [
  "Tus conversaciones con el asistente",
  "Tus notas, tu diario y tus favoritos",
  "Tu progreso en el camino y en los planes, y tus reflexiones",
  "Tus recordatorios",
];

export default async function PrivacidadPage() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) redirect("/ingresar?callbackUrl=/perfil/privacidad");

  return (
    <main className="flex flex-col gap-8">
      <nav className="text-sm">
        <Link href="/perfil" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconArrowLeft className="h-4 w-4" /> Más
        </Link>
      </nav>
      <PageHeader
        eyebrow="Privacidad"
        title="Tus datos son tuyos"
        description="Explicado en simple: qué guardamos, quién lo ve y cómo llevártelo o borrarlo."
      />
      <Card>
        <SectionTitle>Solo vos podés ver</SectionTitle>
        <ul className="flex flex-col gap-2 text-sm">
          {PRIVATE.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {p}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Ni tu pastor ni el equipo de Camino de Fe tienen acceso. La base de datos lo impone además del código. Tu
          iglesia solo recibe lo que vos le enviás (un mensaje, tu pedido de ser miembro).
        </p>
      </Card>
      <Card>
        <SectionTitle>Analítica</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Contamos totales anónimos por día (por ejemplo, «cuántos capítulos se leyeron»), sin tu identidad, sin cookies
          de seguimiento y sin herramientas de terceros. No vendemos ni compartimos datos.
        </p>
      </Card>
      <Card>
        <SectionTitle>Llevate tus datos</SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground">Descargá un archivo con todo lo que guardamos de tu cuenta.</p>
        <ButtonLink href="/api/cuenta/exportar" variant="secondary">
          <IconDownload className="h-4 w-4" /> Descargar mis datos
        </ButtonLink>
      </Card>
      <Card className="border-danger/30">
        <SectionTitle>Eliminar mi cuenta</SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground">
          Se borran de forma definitiva tu cuenta y todos tus datos personales. No se puede deshacer.
        </p>
        <DeleteAccount />
      </Card>
      <p className="text-xs text-muted-foreground">
        Más detalle en la <Link href="/privacidad" className="underline">política de privacidad</Link>.
      </p>
    </main>
  );
}
