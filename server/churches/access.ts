/**
 * Helpers de autorización específicos del módulo de iglesias. Se apoyan en la
 * matriz central (`server/authz`) para no duplicar reglas.
 */
import { can, type Actor } from "@/server/authz/permissions";

export function canManageChurch(actor: Actor, churchId: string): boolean {
  return can(actor, "church:edit", { churchId });
}

export function canHandleContactRequests(
  actor: Actor,
  churchId: string,
): boolean {
  return can(actor, "church:manage_contact_requests", { churchId });
}

export function canViewChurchStats(actor: Actor, churchId: string): boolean {
  return can(actor, "church:view_aggregate_stats", { churchId });
}

export function canVerifyChurches(actor: Actor): boolean {
  return can(actor, "church:verify");
}

/** Iglesias (verificadas) que el actor puede gestionar, para el panel pastoral. */
export function managedChurchIds(actor: Actor): string[] {
  const ids = actor.roles
    .filter(
      (r) =>
        r.scope === "church" &&
        r.churchId != null &&
        ["pastor", "church_leader", "church_admin"].includes(r.role),
    )
    .map((r) => r.churchId as string);
  return [...new Set(ids)];
}
