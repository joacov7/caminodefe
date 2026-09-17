/**
 * Lógica de donaciones/aportes (pura y testeable).
 *
 * Principios (docs/16): fondos separados por destino, destinatario visible,
 * confirmación previa, sin porcentajes automáticos de diezmo, voluntario.
 */
import { z } from "zod";

export const CONTRIBUTION_TYPES = ["platform", "church", "mission"] as const;
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

/** Montos sugeridos (unidad mínima, ARS). Solo sugerencias, nunca obligatorios. */
export const SUGGESTED_AMOUNTS_MINOR = [50000, 100000, 200000, 500000];

export const donationSchema = z
  .object({
    type: z.enum(CONTRIBUTION_TYPES),
    // Monto en unidad mínima (centavos). Debe ser positivo.
    amountMinor: z.number().int().positive("El monto debe ser mayor a cero."),
    currency: z.string().length(3).default("ARS"),
    recipientChurchId: z.string().min(1).optional(),
    note: z.string().max(500).optional(),
  })
  .refine(
    (d) => d.type !== "church" || Boolean(d.recipientChurchId),
    { message: "Una ofrenda a una iglesia requiere elegir la iglesia.", path: ["recipientChurchId"] },
  );

export type DonationInput = z.infer<typeof donationSchema>;

export const CONTRIBUTION_LABELS: Record<ContributionType, string> = {
  platform: "Sostener Camino de Fe",
  church: "Ofrenda a una iglesia",
  mission: "Colaboración con una misión",
};
