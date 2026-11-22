import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runMaintenance } from "@/server/platform/maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tarea diaria (Vercel Cron, ver vercel.json). Vercel envía
 * `Authorization: Bearer <CRON_SECRET>`; sin secreto configurado, la ruta no
 * hace nada.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const ok =
    Boolean(secret) &&
    auth.length === expected.length &&
    timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await runMaintenance()) });
  } catch (err) {
    console.error("Mantenimiento:", err instanceof Error ? err.message : "error");
    return NextResponse.json({ error: "Falló el mantenimiento." }, { status: 500 });
  }
}
