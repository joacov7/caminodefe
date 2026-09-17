"use server";

/**
 * Server actions de facturación. Etapa "donación primero", SIN cobro real:
 * - Premium se activa de forma simulada (para validar la propuesta de valor).
 * - Las donaciones se REGISTRAN como "pendiente"; el dinero no se procesa.
 * Todo con sesión requerida y validación en el servidor.
 */
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { subscriptions, contributions } from "@/db/schema";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { donationSchema, type DonationInput } from "./donations";
import { getPaymentProvider } from "@/server/payments/provider";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireUserId(): Promise<string | null> {
  const actor = await getActor();
  // Cualquier usuario registrado puede gestionar su propia suscripción/aporte.
  return can(actor, "notes:manage_own") ? actor.userId : null;
}

/** Activa Premium de forma SIMULADA (sin cobro en esta etapa). */
export async function activatePremium(): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Necesitás iniciar sesión." };
  try {
    const db = getDb();
    await db
      .insert(subscriptions)
      .values({ userId, planId: "premium", status: "active" })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: { planId: "premium", status: "active", canceledAt: null },
      });
    revalidatePath("/plan");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo activar Premium." };
  }
}

/** Vuelve al plan gratuito. */
export async function cancelPremium(): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Necesitás iniciar sesión." };
  try {
    const db = getDb();
    await db
      .insert(subscriptions)
      .values({ userId, planId: "free", status: "active" })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: { planId: "free", status: "active", canceledAt: new Date() },
      });
    revalidatePath("/plan");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el plan." };
  }
}

/** Registra un aporte voluntario. NO procesa cobro en esta etapa. */
export async function recordDonation(
  input: DonationInput,
): Promise<ActionResult<{ pending: boolean; checkoutUrl: string | null }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Necesitás iniciar sesión." };

  const parsed = donationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  try {
    const provider = getPaymentProvider();
    const checkout = await provider.createCheckout({
      userId,
      amountMinor: d.amountMinor,
      currency: d.currency,
      concept: `Aporte (${d.type})`,
    });

    await getDb()
      .insert(contributions)
      .values({
        userId,
        type: d.type,
        recipientChurchId: d.type === "church" ? d.recipientChurchId : null,
        amountMinor: d.amountMinor,
        currency: d.currency,
        note: d.note,
        status: checkout.status,
        provider: checkout.provider,
        providerRef: checkout.providerRef,
      });

    revalidatePath("/apoyar");
    return {
      ok: true,
      data: { pending: checkout.status === "pending", checkoutUrl: checkout.checkoutUrl },
    };
  } catch {
    return { ok: false, error: "No se pudo registrar el aporte." };
  }
}
