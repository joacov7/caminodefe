/**
 * Lógica de solicitudes de contacto pastoral (pura y testeable).
 *
 * Principios (docs/13): el usuario decide contactar, ve quién recibe la
 * solicitud, elige un motivo general y puede retirarla mientras no esté resuelta.
 */

export type ContactStatus =
  | "sent"
  | "received"
  | "in_progress"
  | "resolved"
  | "withdrawn";

/** Motivos generales ofrecidos al usuario (no datos sensibles obligatorios). */
export const CONTACT_REASONS = [
  "oracion",
  "acompanamiento",
  "consulta_biblica",
  "quiero_congregar",
  "otro",
] as const;

export type ContactReason = (typeof CONTACT_REASONS)[number];

export function isValidReason(value: string): value is ContactReason {
  return (CONTACT_REASONS as readonly string[]).includes(value);
}

// Transiciones que puede hacer QUIEN GESTIONA la iglesia (pastor/líder/admin).
const CHURCH_TRANSITIONS: Record<ContactStatus, ContactStatus[]> = {
  sent: ["received"],
  received: ["in_progress", "resolved"],
  in_progress: ["resolved"],
  resolved: [],
  withdrawn: [],
};

/** El usuario puede retirar su solicitud mientras no esté resuelta ni retirada. */
export function canWithdraw(current: ContactStatus): boolean {
  return current !== "resolved" && current !== "withdrawn";
}

/** ¿Puede la iglesia mover la solicitud de `current` a `next`? */
export function canChurchTransition(
  current: ContactStatus,
  next: ContactStatus,
): boolean {
  return CHURCH_TRANSITIONS[current].includes(next);
}
