/**
 * Construye el `Actor` (usuario autenticado + sus roles) a partir de la sesión.
 * Es la entrada a la autorización server-side: los roles se leen de la DB, nunca
 * del cliente.
 */
import "server-only";
import { and, eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { churches, userRoles } from "@/db/schema";
import type { Actor, RoleAssignment } from "./permissions";

export async function getActor(): Promise<Actor> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (!userId) return { userId: null, roles: [] };

  let roles: RoleAssignment[] = [];
  try {
    const rows = await getDb()
      .select({
        role: userRoles.role,
        scope: userRoles.scope,
        churchId: userRoles.churchId,
      })
      .from(userRoles)
      .leftJoin(churches, eq(churches.id, userRoles.churchId))
      // Los roles de iglesia SOLO valen si la iglesia está verificada: un
      // pastor de una iglesia pendiente, rechazada o suspendida no tiene
      // permisos pastorales (docs/06 G.3 "Verificación").
      .where(
        and(
          eq(userRoles.userId, userId),
          or(eq(userRoles.scope, "platform"), eq(churches.status, "verified")),
        ),
      );
    roles = rows.map((r) => ({
      role: r.role,
      scope: r.scope,
      churchId: r.churchId,
    }));
  } catch {
    // Sin DB configurada: usuario autenticado pero sin roles cargados.
    roles = [];
  }

  return { userId, roles };
}
