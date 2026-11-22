import { NextResponse } from "next/server";
import { getVerifiedChurchBySlug } from "@/server/churches/queries";
import { qrSvg } from "@/lib/qr";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

/** QR (SVG descargable) del enlace de invitación de una iglesia verificada. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("iglesia") ?? "";
  const church = await getVerifiedChurchBySlug(slug).catch(() => null);
  if (!church) return NextResponse.json({ error: "Iglesia no encontrada." }, { status: 404 });
  const svg = qrSvg(`${siteUrl()}/i/${church.slug}`, { label: `Invitación a ${church.name}` });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="qr-${church.slug}.svg"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
