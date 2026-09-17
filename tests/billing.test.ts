import { describe, it, expect } from "vitest";
import {
  PLANS,
  getPlan,
  planDailyLimit,
  formatAmount,
} from "@/server/billing/plans";
import { donationSchema } from "@/server/billing/donations";
import { checkDailyLimit } from "@/server/ai/limits";

describe("catálogo de planes", () => {
  it("free y premium tienen límites coherentes", () => {
    expect(PLANS.free.aiMessagesPerDay).toBeLessThan(PLANS.premium.aiMessagesPerDay);
    expect(getPlan("premium").id).toBe("premium");
    expect(getPlan("desconocido").id).toBe("free"); // fallback
    expect(getPlan(null).id).toBe("free");
  });

  it("el límite del asistente proviene del catálogo (fuente única)", () => {
    expect(checkDailyLimit("free", 0).limit).toBe(planDailyLimit("free"));
    expect(checkDailyLimit("premium", 0).limit).toBe(PLANS.premium.aiMessagesPerDay);
  });

  it("formatea montos en pesos", () => {
    // 200000 centavos = $2.000
    expect(formatAmount(200000, "ARS")).toContain("2.000");
  });
});

describe("validación de donaciones", () => {
  it("rechaza montos no positivos", () => {
    expect(
      donationSchema.safeParse({ type: "platform", amountMinor: 0, currency: "ARS" }).success,
    ).toBe(false);
    expect(
      donationSchema.safeParse({ type: "platform", amountMinor: 100000, currency: "ARS" }).success,
    ).toBe(true);
  });

  it("una ofrenda a iglesia exige elegir la iglesia", () => {
    expect(
      donationSchema.safeParse({ type: "church", amountMinor: 100000, currency: "ARS" }).success,
    ).toBe(false);
    expect(
      donationSchema.safeParse({
        type: "church",
        amountMinor: 100000,
        currency: "ARS",
        recipientChurchId: "iglesia-1",
      }).success,
    ).toBe(true);
  });
});
