import { NextResponse } from "next/server";
import { getVerifiedChurchBySlug } from "@/server/churches/queries";
import { track } from "@/server/platform/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Enlace corto de invitación de una iglesia (el que lleva el QR).
 * Cuenta la apertura de forma ANÓNIMA y lleva al perfil con bienvenida.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const church = await getVerifiedChurchBySlug(slug).catch(() => null);
  if (!church) return NextResponse.redirect(new URL("/iglesias", req.url));
  void track("church_invite_opened");
  return NextResponse.redirect(new URL(`/iglesias/${church.slug}?invitacion=1`, req.url));
}
