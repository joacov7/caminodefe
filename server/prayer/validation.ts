import { z } from "zod";

/** Validación de pedidos de oración (pura). */
export const prayerSchema = z
  .object({
    body: z.string().trim().min(3, "Escribí tu pedido.").max(2000, "Máximo 2000 caracteres."),
    scope: z.enum(["private", "church"]),
    churchId: z.string().min(1).max(64).optional().nullable(),
    anonymous: z.boolean().default(false),
  })
  .refine((v) => v.scope === "private" || Boolean(v.churchId), {
    message: "Elegí la iglesia con la que querés compartirlo.",
    path: ["churchId"],
  })
  .transform((v) => ({
    ...v,
    churchId: v.scope === "church" ? v.churchId! : null,
    // El anonimato solo tiene sentido al compartir.
    anonymous: v.scope === "church" ? v.anonymous : false,
  }));

export type PrayerInput = z.input<typeof prayerSchema>;

export const answerSchema = z.string().trim().max(2000).optional();

export const PRAYER_STATUS_LABELS: Record<string, string> = {
  open: "Pendiente",
  praying: "Tu iglesia está orando",
  answered: "Respondida",
};
