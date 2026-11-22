import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listMyPrayers } from "@/server/prayer/queries";
import { listMyChurches } from "@/server/churches/queries";
import { PageHeader, Notice, EmptyState, SectionTitle } from "@/components/ui";
import { PrayerForm } from "./prayer-form";
import { PrayerItem } from "./prayer-item";

export const metadata: Metadata = {
  title: "Oración",
  description: "Guardá tus pedidos de oración y, si querés, compartilos con el equipo pastoral de tu iglesia.",
};
export const dynamic = "force-dynamic";

export default async function OracionPage() {
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <main className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Oración"
          title="Llevá tus pedidos a Dios"
          description="«Por nada estéis afanosos; sino sean notorias vuestras peticiones delante de Dios en toda oración y ruego» (Filipenses 4:6)."
        />
        <Notice>
          <Link href="/ingresar?callbackUrl=/oracion" className="font-semibold text-primary hover:underline">
            Ingresá
          </Link>{" "}
          para guardar tus pedidos. Son privados: solo vos los ves, salvo que elijas compartirlos con tu iglesia.
        </Notice>
      </main>
    );
  }

  const [prayers, myChurches] = await Promise.all([
    listMyPrayers(userId).catch(() => []),
    listMyChurches(userId).catch(() => []),
  ]);
  const churches = myChurches.filter((c) => c.status === "active").map((c) => ({ id: c.churchId, name: c.name }));
  const open = prayers.filter((p) => p.status !== "answered");
  const answered = prayers.filter((p) => p.status === "answered");

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Oración"
        title="Tus pedidos de oración"
        description="«Por nada estéis afanosos; sino sean notorias vuestras peticiones delante de Dios en toda oración y ruego» (Filipenses 4:6)."
      />
      <PrayerForm churches={churches} />
      {churches.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Para pedir que tu iglesia ore por vos, primero sumate como miembro desde su perfil en{" "}
          <Link href="/iglesias" className="font-medium text-primary hover:underline">Iglesias</Link>.
        </p>
      )}
      <section>
        <SectionTitle>Orando ({open.length})</SectionTitle>
        {open.length === 0 ? (
          <EmptyState title="No tenés pedidos pendientes">Cuando escribas uno, va a aparecer acá.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {open.map((p) => (
              <PrayerItem key={p.id} prayer={{ ...p, createdAt: p.createdAt.toISOString() }} />
            ))}
          </ul>
        )}
      </section>
      {answered.length > 0 && (
        <section>
          <SectionTitle>Respuestas de Dios ({answered.length})</SectionTitle>
          <ul className="flex flex-col gap-3">
            {answered.map((p) => (
              <PrayerItem key={p.id} prayer={{ ...p, createdAt: p.createdAt.toISOString() }} />
            ))}
          </ul>
        </section>
      )}
      <Notice>
        Si estás atravesando una situación de riesgo, buscá ayuda humana ahora: 911 (emergencias) o 135 (asistencia al
        suicida). La oración acompaña; no reemplaza esa ayuda.
      </Notice>
    </main>
  );
}
