/**
 * Lógica PURA de progreso (camino guiado y planes). Sin puntajes: solo "qué
 * completé" y "qué sigue". Testeable sin DB.
 */
import { GUIDED_PATH, type GuidedStage } from "@/content/guided-path";
import type { ReadingPlan } from "@/content/reading-plans";
import { z } from "zod";

export type StageState = "completed" | "current" | "upcoming";

/** Estado de cada etapa: la "actual" es la primera no completada. */
export function stageStates(completed: Set<string>): { stage: GuidedStage; state: StageState }[] {
  let currentAssigned = false;
  return GUIDED_PATH.map((stage) => {
    if (completed.has(stage.id)) return { stage, state: "completed" as const };
    if (!currentAssigned) {
      currentAssigned = true;
      return { stage, state: "current" as const };
    }
    return { stage, state: "upcoming" as const };
  });
}

export function nextStage(completed: Set<string>): GuidedStage | null {
  return GUIDED_PATH.find((s) => !completed.has(s.id)) ?? null;
}

export type PlanStatus = {
  completedCount: number;
  nextDay: number | null; // null = plan terminado
  finished: boolean;
};

export function planStatus(plan: ReadingPlan, completedDays: number[]): PlanStatus {
  const done = new Set(completedDays.filter((d) => d >= 1 && d <= plan.days));
  let nextDay: number | null = null;
  for (let d = 1; d <= plan.days; d++) {
    if (!done.has(d)) {
      nextDay = d;
      break;
    }
  }
  return { completedCount: done.size, nextDay, finished: nextDay === null };
}

export const reminderSchema = z.object({
  enabled: z.boolean(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)."),
  days: z.array(z.number().int().min(0).max(6)).min(1, "Elegí al menos un día.").max(7),
  timezone: z
    .string()
    .min(3)
    .max(64)
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat("es", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "Zona horaria inválida."),
});
export type ReminderInput = z.infer<typeof reminderSchema>;

export const reflectionSchema = z.string().trim().max(4000).optional();
