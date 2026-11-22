import { NextResponse } from "next/server";
import { getActor } from "@/server/authz/session";
import { getVisibleEvent } from "@/server/events/queries";
import { buildEventIcs } from "@/lib/ics";
import { siteUrl } from "@/lib/site";
import { track } from "@/server/platform/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActor();
  const e = await getVisibleEvent(id, actor).catch(() => null);
  if (!e) return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
  void track("event_calendar_added");
  const ics = buildEventIcs({
    id: e.id,
    title: `${e.title} · ${e.churchName}`,
    description: e.description,
    location: e.location ?? e.onlineUrl,
    startsAt: new Date(e.startsAt),
    endsAt: e.endsAt ? new Date(e.endsAt) : null,
    url: `${siteUrl()}/eventos/${e.id}`,
  });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="evento.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
