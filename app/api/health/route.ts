import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Endpoint de salud para monitoreo/despliegue. No expone datos sensibles. */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "camino-de-fe",
    time: new Date().toISOString(),
  });
}
