"use server";

/**
 * Server actions del módulo de iglesias. Toda acción valida la sesión y la
 * autorización en el servidor antes de tocar la base de datos.
 */
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { contactRequests, churches, auditLog, userRoles, churchMembers } from "@/db/schema";
import { consumeRateLimit, RATE_LIMITS } from "@/server/platform/rate-limit";
import { track } from "@/server/platform/analytics";
import { isChurchPlanId } from "@/server/billing/church-plans";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import {
  canHandleContactRequests,
  canVerifyChurches,
} from "./access";
import {
  isValidReason,
  canChurchTransition,
  canWithdraw,
  type ContactStatus,
} from "./contact";

export type ActionResult = { ok: true } | { ok: false; error: string };

const createSchema = z.object({
  churchId: z.string().min(1),
  reason: z.string().refine(isValidReason, "Motivo inválido."),
  message: z.string().max(2000).optional(),
});

/** El usuario solicita contacto con una iglesia (voluntario). */
export async function createContactRequest(input: {
  churchId: string;
  reason: string;
  message?: string;
}): Promise<ActionResult> {
  const actor = await getActor();
  if (!can(actor, "contact:create")) {
    return { ok: false, error: "Necesitás iniciar sesión para contactar." };
  }
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  // Anti-abuso: pocas solicitudes por hora por persona.
  const rl = await consumeRateLimit(RATE_LIMITS.contact, `u:${actor.userId}`);
  if (!rl.allowed) {
    return { ok: false, error: "Enviaste varias solicitudes. Probá de nuevo más tarde." };
  }

  try {
    // Solo se puede contactar a iglesias VERIFICADAS.
    const target = await getDb()
      .select({ id: churches.id })
      .from(churches)
      .where(and(eq(churches.id, parsed.data.churchId), eq(churches.status, "verified")))
      .limit(1);
    if (!target[0]) return { ok: false, error: "La iglesia no está disponible." };

    await getDb().insert(contactRequests).values({
      userId: actor.userId!,
      churchId: parsed.data.churchId,
      reason: parsed.data.reason,
      message: parsed.data.message,
      status: "sent",
    });
    void track("contact_request_sent", parsed.data.reason);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo enviar la solicitud." };
  }
}

/** El usuario retira su propia solicitud (si aún no fue resuelta). */
export async function withdrawContactRequest(
  requestId: string,
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor.userId) return { ok: false, error: "No autenticado." };

  try {
    const db = getDb();
    const rows = await db
      .select({ userId: contactRequests.userId, status: contactRequests.status })
      .from(contactRequests)
      .where(eq(contactRequests.id, requestId))
      .limit(1);
    const row = rows[0];
    if (!row || row.userId !== actor.userId) {
      return { ok: false, error: "Solicitud no encontrada." };
    }
    if (!canWithdraw(row.status as ContactStatus)) {
      return { ok: false, error: "La solicitud ya no puede retirarse." };
    }
    await db
      .update(contactRequests)
      .set({ status: "withdrawn" })
      .where(eq(contactRequests.id, requestId));
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo retirar la solicitud." };
  }
}

/** La iglesia avanza el estado de una solicitud (rol verificado). */
export async function updateContactStatus(
  requestId: string,
  next: ContactStatus,
): Promise<ActionResult> {
  const actor = await getActor();
  try {
    const db = getDb();
    const rows = await db
      .select({
        churchId: contactRequests.churchId,
        status: contactRequests.status,
      })
      .from(contactRequests)
      .where(eq(contactRequests.id, requestId))
      .limit(1);
    const row = rows[0];
    if (!row) return { ok: false, error: "Solicitud no encontrada." };

    if (!canHandleContactRequests(actor, row.churchId)) {
      return { ok: false, error: "No autorizado." };
    }
    if (!canChurchTransition(row.status as ContactStatus, next)) {
      return { ok: false, error: "Transición de estado no permitida." };
    }
    await db
      .update(contactRequests)
      .set({ status: next, assignedTo: actor.userId })
      .where(eq(contactRequests.id, requestId));
    revalidatePath("/pastoral");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar la solicitud." };
  }
}

/** Admin de plataforma verifica/rechaza/suspende una iglesia. */
export async function setChurchStatus(
  churchId: string,
  status: "verified" | "rejected" | "suspended" | "pending",
): Promise<ActionResult> {
  const actor = await getActor();
  if (!canVerifyChurches(actor)) {
    return { ok: false, error: "No autorizado." };
  }
  try {
    const db = getDb();
    const [updated] = await db
      .update(churches)
      .set({ status })
      .where(eq(churches.id, churchId))
      .returning({ contact: churches.contact });
    // Al verificar, se otorga el rol solicitado a quien pidió el alta.
    const requestedBy = updated?.contact?.requestedBy;
    const requestedRole = updated?.contact?.requestedRole;
    if (status === "verified" && requestedBy) {
      const role = (["pastor", "church_leader", "church_admin"] as const).find((r) => r === requestedRole) ?? "pastor";
      await db
        .insert(userRoles)
        .values({ userId: requestedBy, role, scope: "church", churchId })
        .onConflictDoNothing();
      await db
        .insert(churchMembers)
        .values({ churchId, userId: requestedBy, status: "active" })
        .onConflictDoUpdate({ target: [churchMembers.churchId, churchMembers.userId], set: { status: "active" } });
    }
    // Auditoría de acción administrativa sensible.
    await db.insert(auditLog).values({
      actorUserId: actor.userId,
      action: "church.set_status",
      entity: "church",
      entityId: churchId,
      churchId,
      metadata: { status },
    });
    revalidatePath("/admin/iglesias");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el estado." };
  }
}

/** Admin asigna el plan de una iglesia (sin cobro aún; también para becas). */
export async function setChurchPlan(churchId: string, plan: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!can(actor, "plans:configure")) return { ok: false, error: "No autorizado." };
  if (!isChurchPlanId(plan)) return { ok: false, error: "Plan inválido." };
  try {
    const db = getDb();
    await db.update(churches).set({ plan }).where(eq(churches.id, churchId));
    await db.insert(auditLog).values({
      actorUserId: actor.userId,
      action: "church.set_plan",
      entity: "church",
      entityId: churchId,
      churchId,
      metadata: { plan },
    });
    revalidatePath("/admin/iglesias");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el plan." };
  }
}
