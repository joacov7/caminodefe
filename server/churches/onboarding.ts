import { z } from "zod";

/** Validación y utilidades puras del alta de iglesias y la membresía. */
export const churchApplicationSchema = z.object({
  name: z.string().trim().min(3, "Nombre demasiado corto.").max(120),
  generalLocation: z.string().trim().min(3, "Indicá ciudad o barrio.").max(120),
  description: z.string().trim().max(1500).optional().transform((v) => v || null),
  doctrinalStatement: z.string().trim().max(3000).optional().transform((v) => v || null),
  website: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || /^https?:\/\//.test(v), "El sitio debe empezar con https://"),
  contactEmail: z.string().trim().email("Correo inválido.").max(200),
  contactPhone: z.string().trim().max(40).optional().transform((v) => v || null),
  role: z.enum(["pastor", "church_leader", "church_admin"]).default("pastor"),
  acceptTerms: z.boolean().refine((v) => v, "Necesitamos tu confirmación."),
});
export type ChurchApplicationInput = z.input<typeof churchApplicationSchema>;

/** "Iglesia Evangélica Bautista — Centro" → "iglesia-evangelica-bautista-centro" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Primer slug libre: base, base-2, base-3… */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const b = base || "iglesia";
  if (!taken.has(b)) return b;
  for (let i = 2; i < 1000; i++) if (!taken.has(`${b}-${i}`)) return `${b}-${i}`;
  return `${b}-${crypto.randomUUID().slice(0, 6)}`;
}

export type MembershipStatus = "requested" | "active" | "left" | "declined";
