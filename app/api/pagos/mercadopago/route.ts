import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLog, contributions } from "@/db/schema";
import { siteUrl } from "@/lib/site";
import {
  MercadoPagoProvider,
  mapPaymentStatus,
  paymentMatches,
  verifyWebhookSignature,
} from "@/server/payments/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de Mercado Pago. Responde 200 rápido; el estado se obtiene de la API
 * (no del cuerpo recibido) y se valida contra el aporte registrado.
 */
export async function POST(req: Request) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Pagos no habilitados." }, { status: 404 });

  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (type !== "payment" || !dataId) return NextResponse.json({ ignored: true });

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (
    secret &&
    !verifyWebhookSignature({
      secret,
      signatureHeader: req.headers.get("x-signature"),
      requestId: req.headers.get("x-request-id"),
      dataId,
    })
  ) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  try {
    const mp = new MercadoPagoProvider(token, siteUrl());
    const payment = await mp.getPayment(dataId);
    const ref = payment.external_reference;
    if (!ref) return NextResponse.json({ ignored: true });
    const db = getDb();
    const [row] = await db.select().from(contributions).where(eq(contributions.id, ref)).limit(1);
    if (!row) return NextResponse.json({ ignored: true });

    let status = mapPaymentStatus(payment.status);
    if (status === "confirmed" && !paymentMatches(payment, row)) status = "failed";
    await db
      .update(contributions)
      .set({ status, provider: "mercadopago", providerRef: String(payment.id) })
      .where(eq(contributions.id, ref));
    await db.insert(auditLog).values({
      action: "contribution.update",
      entity: "contribution",
      entityId: ref,
      metadata: { status, mpStatus: payment.status },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook Mercado Pago:", err instanceof Error ? err.message : "error");
    // 500 → Mercado Pago reintenta más tarde.
    return NextResponse.json({ error: "Error temporal." }, { status: 500 });
  }
}
