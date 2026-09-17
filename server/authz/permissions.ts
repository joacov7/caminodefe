/**
 * Autorización — fuente de verdad en el servidor.
 *
 * Regla de oro: NUNCA se confía solo en ocultar UI. Cada endpoint/acción del
 * servidor debe consultar `can(...)`. La RLS de Postgres actúa como defensa en
 * profundidad, no como único control.
 *
 * Privacidad no negociable: nadie (ni pastor ni admin) accede a conversaciones,
 * notas o diario privados de otro usuario. Esas acciones no existen en la matriz.
 */

export type Role =
  | "visitor"
  | "registered"
  | "premium"
  | "pastor"
  | "church_leader"
  | "church_admin"
  | "platform_admin"
  | "content_moderator"
  | "finance_officer";

export type RoleAssignment = {
  role: Role;
  scope: "platform" | "church";
  churchId?: string | null;
};

export type Actor = {
  userId: string | null; // null = visitante no autenticado
  roles: RoleAssignment[];
};

/** Acciones del sistema sujetas a autorización. */
export type Action =
  | "bible:read"
  | "assistant:use"
  | "notes:manage_own"
  | "contact:create"
  | "church:edit"
  | "church:publish_content"
  | "church:manage_contact_requests"
  | "church:view_aggregate_stats"
  | "content:moderate"
  | "church:verify"
  | "finance:view_reports"
  | "plans:configure";

/** Contexto opcional de la acción (p. ej. la iglesia objetivo). */
export type Context = {
  churchId?: string | null;
};

const VERIFIED_CHURCH_ROLES: Role[] = ["pastor", "church_leader", "church_admin"];

function hasPlatformRole(actor: Actor, role: Role): boolean {
  return actor.roles.some((r) => r.scope === "platform" && r.role === role);
}

/**
 * ¿El actor tiene alguno de estos roles en la iglesia indicada?
 * Si no se indica `churchId`, se exige que el rol exista en ALGUNA iglesia.
 */
function hasChurchRole(
  actor: Actor,
  roles: Role[],
  churchId?: string | null,
): boolean {
  return actor.roles.some(
    (r) =>
      r.scope === "church" &&
      roles.includes(r.role) &&
      (churchId == null || r.churchId === churchId),
  );
}

function isRegistered(actor: Actor): boolean {
  return actor.userId != null;
}

/**
 * Decide si `actor` puede ejecutar `action` en el `context` dado.
 * Server-side. No depende de la UI.
 */
export function can(actor: Actor, action: Action, context: Context = {}): boolean {
  const platformAdmin = hasPlatformRole(actor, "platform_admin");

  switch (action) {
    // Lectura pública.
    case "bible:read":
      return true;

    // Requiere cuenta (los límites por plan se aplican aparte).
    case "assistant:use":
    case "notes:manage_own":
    case "contact:create":
      return isRegistered(actor);

    // Gestión de la propia iglesia (rol verificado en esa iglesia) o admin.
    case "church:edit":
    case "church:publish_content":
    case "church:manage_contact_requests":
    case "church:view_aggregate_stats":
      return (
        platformAdmin ||
        hasChurchRole(actor, VERIFIED_CHURCH_ROLES, context.churchId)
      );

    // Moderación de contenido.
    case "content:moderate":
      return platformAdmin || hasPlatformRole(actor, "content_moderator");

    // Verificación de iglesias/pastores y configuración de planes: solo plataforma.
    case "church:verify":
    case "plans:configure":
      return platformAdmin;

    // Reportes financieros: permiso separado.
    case "finance:view_reports":
      return platformAdmin || hasPlatformRole(actor, "finance_officer");

    default: {
      // Exhaustividad: si se agrega una acción, TypeScript obliga a manejarla.
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
