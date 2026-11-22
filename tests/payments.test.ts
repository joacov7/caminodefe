import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import {
  MercadoPagoProvider,
  mapPaymentStatus,
  paymentMatches,
  verifyWebhookSignature,
} from "@/server/payments/mercadopago";
import { CHURCH_PLANS, canAddUpcomingEvent, getChurchPlan } from "@/server/billing/church-plans";

describe("Mercado Pago (respuestas simuladas)", () => {
  it("crea la preferencia con referencia, monto en pesos e idempotencia", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fake = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: "pref-1", init_point: "https://mp/checkout" }), { status: 201 });
    }) as unknown as typeof fetch;
    const mp = new MercadoPagoProvider("TEST-token", "https://caminodefe.app", fake);
    const r = await mp.createCheckout({ userId: "u", amountMinor: 150050, currency: "ARS", concept: "Aporte", reference: "contrib-1" });
    expect(r).toEqual({ provider: "mercadopago", status: "pending", checkoutUrl: "https://mp/checkout", providerRef: "pref-1" });
    const body = JSON.parse(String(calls[0]!.init.body));
    expect(body.items[0].unit_price).toBe(1500.5);
    expect(body.external_reference).toBe("contrib-1");
    expect(body.notification_url).toBe("https://caminodefe.app/api/pagos/mercadopago");
    expect((calls[0]!.init.headers as Record<string, string>)["X-Idempotency-Key"]).toBe("contrib-1");
  });
  it("sin referencia no crea cobro; un error de la API se propaga", async () => {
    const bad = (async () => new Response("x", { status: 401 })) as unknown as typeof fetch;
    const mp = new MercadoPagoProvider("t", "https://x", bad);
    await expect(mp.createCheckout({ userId: "u", amountMinor: 1, currency: "ARS", concept: "c" })).rejects.toThrow();
    await expect(mp.createCheckout({ userId: "u", amountMinor: 1, currency: "ARS", concept: "c", reference: "r" })).rejects.toThrow(/401/);
  });
  it("mapea estados y valida monto y moneda", () => {
    expect(mapPaymentStatus("approved")).toBe("confirmed");
    expect(mapPaymentStatus("rejected")).toBe("failed");
    expect(mapPaymentStatus("in_process")).toBe("pending");
    expect(paymentMatches({ transaction_amount: 1500.5, currency_id: "ARS" }, { amountMinor: 150050, currency: "ARS" })).toBe(true);
    expect(paymentMatches({ transaction_amount: 1, currency_id: "ARS" }, { amountMinor: 150050, currency: "ARS" })).toBe(false);
    expect(paymentMatches({ transaction_amount: 1500.5, currency_id: "USD" }, { amountMinor: 150050, currency: "ARS" })).toBe(false);
  });
  it("valida la firma del webhook (HMAC) y rechaza falsificaciones", () => {
    const secret = "s3cr3t";
    const v1 = createHmac("sha256", secret).update("id:123;request-id:req-9;ts:1700;").digest("hex");
    expect(verifyWebhookSignature({ secret, signatureHeader: `ts=1700,v1=${v1}`, requestId: "req-9", dataId: "123" })).toBe(true);
    expect(verifyWebhookSignature({ secret, signatureHeader: `ts=1700,v1=${v1}`, requestId: "req-9", dataId: "999" })).toBe(false);
    expect(verifyWebhookSignature({ secret, signatureHeader: null, requestId: null, dataId: "123" })).toBe(false);
  });
});

describe("planes para iglesias", () => {
  it("límite de eventos próximos por plan", () => {
    expect(canAddUpcomingEvent("free", 9)).toBe(true);
    expect(canAddUpcomingEvent("free", 10)).toBe(false);
    expect(canAddUpcomingEvent("pro", 10)).toBe(true);
    expect(getChurchPlan("inexistente").id).toBe("free");
  });
  it("el plan gratuito incluye siempre lo esencial para recibir personas", () => {
    expect(CHURCH_PLANS.free.priceMinorMonthly).toBe(0);
    expect(CHURCH_PLANS.free.features.join(" ")).toMatch(/contacto pastoral/);
  });
});
