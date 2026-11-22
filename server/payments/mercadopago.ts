/**
 * Proveedor Mercado Pago — Checkout Pro (redirección a la página de pago de
 * Mercado Pago: nunca tocamos datos de tarjeta). Sin SDK: API REST con fetch.
 *
 * ESTADO: implementado y probado con respuestas simuladas (tests). NO se probó
 * contra el sandbox real: requiere credenciales de prueba (docs/14). Se activa
 * SOLO si existe MERCADOPAGO_ACCESS_TOKEN.
 *
 * Seguridad del webhook: la notificación solo trae un id; el estado real se
 * obtiene consultando la API con nuestro token, y se valida referencia, monto y
 * moneda contra lo registrado. Si hay secreto configurado, se valida además la
 * firma `x-signature` (HMAC-SHA256).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { CheckoutRequest, CheckoutResult, PaymentProvider } from "./provider";

const API = "https://api.mercadopago.com";

type Fetch = typeof fetch;

export class MercadoPagoProvider implements PaymentProvider {
  readonly name = "mercadopago";
  constructor(
    private readonly token: string,
    private readonly siteUrl: string,
    private readonly fetcher: Fetch = fetch,
  ) {}

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    if (!req.reference) throw new Error("Falta la referencia del aporte.");
    const res = await this.fetcher(`${API}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": req.reference,
      },
      body: JSON.stringify({
        items: [
          {
            id: req.reference,
            title: req.concept,
            quantity: 1,
            currency_id: req.currency,
            unit_price: req.amountMinor / 100,
          },
        ],
        external_reference: req.reference,
        notification_url: `${this.siteUrl}/api/pagos/mercadopago`,
        back_urls: {
          success: `${this.siteUrl}/apoyar?estado=ok`,
          pending: `${this.siteUrl}/apoyar?estado=pendiente`,
          failure: `${this.siteUrl}/apoyar?estado=error`,
        },
        auto_return: "approved",
        statement_descriptor: "CAMINO DE FE",
      }),
    });
    if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status}`);
    const data = (await res.json()) as { id: string; init_point: string };
    return { provider: this.name, status: "pending", checkoutUrl: data.init_point, providerRef: data.id };
  }

  /** Consulta el pago real (nunca se confía en el cuerpo del webhook). */
  async getPayment(paymentId: string) {
    const res = await this.fetcher(`${API}/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status}`);
    return (await res.json()) as {
      id: number;
      status: string;
      external_reference: string | null;
      transaction_amount: number;
      currency_id: string;
    };
  }
}

/** Mapea el estado de Mercado Pago al de `contributions`. */
export function mapPaymentStatus(s: string): "pending" | "confirmed" | "failed" | "refunded" | "canceled" {
  switch (s) {
    case "approved":
      return "confirmed";
    case "rejected":
      return "failed";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "cancelled":
      return "canceled";
    default:
      return "pending";
  }
}

/**
 * Valida la firma del webhook (x-signature: "ts=…,v1=…"). Manifiesto según la
 * documentación de Mercado Pago: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 */
export function verifyWebhookSignature(params: {
  secret: string;
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string;
}): boolean {
  const { secret, signatureHeader, requestId, dataId } = params;
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  let manifest = `id:${dataId.toLowerCase()};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** ¿El pago coincide con el aporte registrado? (monto en centavos y moneda) */
export function paymentMatches(
  payment: { transaction_amount: number; currency_id: string },
  expected: { amountMinor: number; currency: string },
): boolean {
  return (
    Math.round(payment.transaction_amount * 100) === expected.amountMinor &&
    payment.currency_id === expected.currency
  );
}
