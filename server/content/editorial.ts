/**
 * Flujo editorial de contenidos (puro y testeable).
 *
 * Estados: borrador → revisión → aprobado → publicado (docs/24).
 * Diferencia el ORIGEN del contenido (IA / persona / iglesia) — nunca se
 * presenta contenido generado por IA como enseñanza humana sin autorización.
 */
import { z } from "zod";

export type EditorialStatus = "draft" | "review" | "approved" | "published";
export type ContentOrigin = "ai" | "human" | "church";
export type ContentType = "devotional" | "study" | "plan" | "group";

const TRANSITIONS: Record<EditorialStatus, EditorialStatus[]> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["published", "review"],
  published: ["review"], // despublicar vuelve a revisión
};

export function canTransition(
  from: EditorialStatus,
  to: EditorialStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export const ORIGIN_LABELS: Record<ContentOrigin, string> = {
  ai: "Generado por IA",
  human: "Revisado por una persona",
  church: "Aprobado por una iglesia",
};

export const STATUS_LABELS: Record<EditorialStatus, string> = {
  draft: "Borrador",
  review: "En revisión",
  approved: "Aprobado",
  published: "Publicado",
};

export const TYPE_LABELS: Record<ContentType, string> = {
  devotional: "Devocional",
  study: "Estudio",
  plan: "Plan de lectura",
  group: "Material para grupos",
};

export const contentSchema = z.object({
  type: z.enum(["devotional", "study", "plan", "group"]),
  title: z.string().min(3).max(160),
  objective: z.string().max(500).optional(),
  passage: z.string().max(120).optional(),
  body: z.string().min(1).max(20000),
  author: z.string().max(160).optional(),
  origin: z.enum(["ai", "human", "church"]),
});

export type ContentInput = z.infer<typeof contentSchema>;
