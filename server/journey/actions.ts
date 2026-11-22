"use server";

/**
 * Acciones del progreso personal. Exigen sesión y operan SOLO sobre los datos
 * del propio usuario, con contexto RLS. Validación con zod en el servidor.
 */
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { withUserContext } from "@/db";
import { guidedPathProgress, readingPlanDays, reminderPrefs } from "@/db/schema";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { getStage } from "@/content/guided-path";
import { getPlan } from "@/content/reading-plans";
import { reminderSchema, reflectionSchema, type ReminderInput } from "./progress";
import { track } from "@/server/platform/analytics";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUserId(): Promise<string | null> {
  const actor = await getActor();
  return can(actor, "notes:manage_own") ? actor.userId : null;
}

export async function completeStage(stageId: string, reflection?: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Iniciá sesión para guardar tu progreso." };
  if (!getStage(stageId)) return { ok: false, error: "Etapa inexistente." };
  const parsed = reflectionSchema.safeParse(reflection);
  if (!parsed.success) return { ok: false, error: "La reflexión es demasiado larga." };
  const text = parsed.data ? parsed.data : null;
  try {
    await withUserContext(userId, (db) => [
      db
        .insert(guidedPathProgress)
        .values({ userId, stageId, reflection: text })
        .onConflictDoUpdate({
          target: [guidedPathProgress.userId, guidedPathProgress.stageId],
          set: { reflection: text },
        }),
    ]);
    void track("guided_stage_completed", stageId);
    revalidatePath("/camino");
    revalidatePath("/inicio");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar. Intentá de nuevo." };
  }
}

export async function uncompleteStage(stageId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autenticado." };
  try {
    await withUserContext(userId, (db) => [
      db
        .delete(guidedPathProgress)
        .where(and(eq(guidedPathProgress.userId, userId), eq(guidedPathProgress.stageId, stageId))),
    ]);
    revalidatePath("/camino");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}

export async function setPlanDay(planId: string, day: number, done: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Iniciá sesión para guardar tu progreso." };
  const plan = getPlan(planId);
  if (!plan || !Number.isInteger(day) || day < 1 || day > plan.days) {
    return { ok: false, error: "Día inválido." };
  }
  try {
    await withUserContext(userId, (db) => [
      done
        ? db.insert(readingPlanDays).values({ userId, planId, day }).onConflictDoNothing()
        : db
            .delete(readingPlanDays)
            .where(
              and(
                eq(readingPlanDays.userId, userId),
                eq(readingPlanDays.planId, planId),
                eq(readingPlanDays.day, day),
              ),
            ),
    ]);
    if (done) void track(day === 1 ? "plan_started" : "reading_day_completed", planId);
    revalidatePath(`/planes/${planId}`);
    revalidatePath("/planes");
    revalidatePath("/inicio");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar." };
  }
}

export async function resetPlan(planId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autenticado." };
  try {
    await withUserContext(userId, (db) => [
      db
        .delete(readingPlanDays)
        .where(and(eq(readingPlanDays.userId, userId), eq(readingPlanDays.planId, planId))),
    ]);
    revalidatePath(`/planes/${planId}`);
    revalidatePath("/planes");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo reiniciar." };
  }
}

export async function saveReminderPrefs(input: ReminderInput): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Iniciá sesión para configurar recordatorios." };
  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const v = { ...parsed.data, updatedAt: new Date() };
  try {
    await withUserContext(userId, (db) => [
      db
        .insert(reminderPrefs)
        .values({ userId, ...v })
        .onConflictDoUpdate({ target: reminderPrefs.userId, set: v }),
    ]);
    revalidatePath("/perfil/recordatorios");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar." };
  }
}
