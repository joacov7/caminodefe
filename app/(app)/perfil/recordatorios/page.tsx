import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getReminderPrefs } from "@/server/journey/queries";
import { PageHeader, Notice } from "@/components/ui";
import { IconArrowLeft } from "@/components/icons";
import { ReminderForm } from "./reminder-form";

export const metadata: Metadata = { title: "Recordatorios" };
export const dynamic = "force-dynamic";

export default async function RecordatoriosPage() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) redirect("/ingresar?callbackUrl=/perfil/recordatorios");
  const prefs = await getReminderPrefs(session.user.id).catch(() => null);

  return (
    <main className="flex flex-col gap-8">
      <nav className="text-sm">
        <Link href="/perfil" className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconArrowLeft className="h-4 w-4" /> Más
        </Link>
      </nav>
      <PageHeader
        eyebrow="Hábito diario"
        title="Tu momento con Dios"
        description="Elegí cuándo querés que te lo recordemos. Lo agregás al calendario de tu teléfono y te avisa a esa hora, sin que tengamos que enviarte notificaciones."
      />
      <ReminderForm
        initial={{
          enabled: prefs?.enabled ?? true,
          time: prefs?.time ?? "08:00",
          days: prefs?.days ?? [0, 1, 2, 3, 4, 5, 6],
          timezone: prefs?.timezone ?? "America/Argentina/Buenos_Aires",
        }}
      />
      <Notice>
        Sin saturar: un único recordatorio, a la hora que elegiste. Podés borrarlo cuando quieras desde tu calendario.
      </Notice>
    </main>
  );
}
