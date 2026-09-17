/**
 * Autorización de contenidos. El contenido de plataforma (sin iglesia) lo
 * gestionan admin/moderadores; el de una iglesia, quienes la gestionan.
 */
import { can, type Actor } from "@/server/authz/permissions";

/** ¿Puede el actor gestionar contenido de este ámbito? */
export function canManageContent(
  actor: Actor,
  churchId: string | null,
): boolean {
  if (churchId) return can(actor, "church:publish_content", { churchId });
  // Contenido de plataforma: admin o moderador.
  return can(actor, "content:moderate");
}
