import { NextResponse } from "next/server";
import { z } from "zod";
import { ANALYTICS_EVENTS, track } from "@/server/platform/analytics";
import { consumeRateLimit, identityFrom } from "@/server/platform/rate-limit";

export const runtime = "nodejs";

const body = z.object({ event: z.enum(["bible_chapter_read", "devotional_read"]) });

/**
 * Contador anónimo para páginas cacheadas (lectura bíblica, devocionales).
 * Solo eventos de una lista cerrada; sin cookies ni identificadores. La IP se
 * usa únicamente (hasheada) para limitar abuso y no se almacena.
 */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !(ANALYTICS_EVENTS as readonly string[]).includes(parsed.data.event)) {
    return new NextResponse(null, { status: 204 });
  }
  const rl = await consumeRateLimit({ bucket: "metric", limit: 120, windowMs: 60_000 }, identityFrom(null, req.headers));
  if (rl.allowed) await track(parsed.data.event);
  return new NextResponse(null, { status: 204 });
}
