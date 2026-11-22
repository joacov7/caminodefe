import { NextResponse } from "next/server";
import { buildReminderIcs } from "@/lib/ics";
import { reminderSchema } from "@/server/journey/progress";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Archivo .ics con un recordatorio recurrente. No requiere sesión ni guarda
 * nada: los parámetros vienen del formulario y se validan.
 */
export function GET(req: Request) {
  const u = new URL(req.url);
  const parsed = reminderSchema.safeParse({
    enabled: true,
    time: u.searchParams.get("time") ?? "08:00",
    days: (u.searchParams.get("days") ?? "0,1,2,3,4,5,6").split(",").filter(Boolean).map(Number),
    timezone: u.searchParams.get("tz") ?? "America/Argentina/Buenos_Aires",
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const ics = buildReminderIcs({ ...parsed.data, url: `${siteUrl()}/inicio` });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="camino-de-fe-recordatorio.ics"',
    },
  });
}
