import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportUserData } from "@/server/account/data";
import { consumeRateLimit, RATE_LIMITS } from "@/server/platform/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Descarga de TODOS los datos propios (derecho de acceso). */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const rl = await consumeRateLimit(RATE_LIMITS.auth, `export:${userId}`);
  if (!rl.allowed) return NextResponse.json({ error: "Probá de nuevo en unos minutos." }, { status: 429 });
  try {
    const data = await exportUserData(userId);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="camino-de-fe-mis-datos.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo generar la exportación." }, { status: 500 });
  }
}
