import { z } from "zod";

/** Validación de eventos (pura). Fechas en ISO o desde <input type=datetime-local>. */
export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "El título es muy corto.").max(120),
    description: z.string().trim().max(2000).optional().transform((v) => v || null),
    location: z.string().trim().max(200).optional().transform((v) => v || null),
    onlineUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || /^https:\/\//.test(v), "El enlace debe empezar con https://"),
    startsAt: z.coerce.date({ invalid_type_error: "Fecha inválida." }),
    endsAt: z
      .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
      .transform((v) => (v instanceof Date ? v : null)),
    visibility: z.enum(["public", "members"]).default("public"),
  })
  .refine((e) => !e.endsAt || e.endsAt > e.startsAt, {
    message: "La finalización debe ser posterior al inicio.",
    path: ["endsAt"],
  });

/** Entrada desde formularios (fechas como ISO string) o código (Date). */
export type EventInput = {
  title: string;
  description?: string;
  location?: string;
  onlineUrl?: string;
  startsAt: string | Date;
  endsAt?: string | Date | null;
  visibility?: "public" | "members";
};
export type EventData = z.output<typeof eventSchema>;

/** Hora local (AR) de un datetime-local "YYYY-MM-DDTHH:MM" → Date UTC. */
export function fromLocalInput(value: string, offsetMinutes = -180): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const utc = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!);
  return new Date(utc - offsetMinutes * 60_000);
}

/** Date → valor para <input type=datetime-local> en hora AR. */
export function toLocalInput(d: Date, offsetMinutes = -180): string {
  const local = new Date(d.getTime() + offsetMinutes * 60_000);
  return local.toISOString().slice(0, 16);
}
