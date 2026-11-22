"use server";

/**
 * Alta de iglesias y membresía.
 * - Cualquier persona registrada puede SOLICITAR el alta de su iglesia; queda
 *   `pending` y SIN permisos pastorales hasta que el equipo la verifique.
 * - Al verificarla, quien la solicitó recibe el rol pedido (ver setChurchStatus).
 * - Una persona puede pedir ser miembro; el equipo pastoral aprueba.
 */
import { revalidatePath } from "next/cache";
import { and, eq, like, or } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLog, churches, churchMembers } from "@/db/schema";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { consumeRateLimit, RATE_LIMITS } from "@/server/platform/rate-limit";
import { churchApplicationSchema, slugify, uniqueSlug, type ChurchApplicationInput } from "./onboarding";

export type ActionResult = { ok: true; slug?: string } | { ok: false; error: string };

export async function applyChurch(input: ChurchApplicationInput): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor.userId) return { ok: false, error: "Iniciá sesión para sumar tu iglesia." };
  const rl = await consumeRateLimit(RATE_LIMITS.contact, `church-apply:${actor.userId}`);
  if (!rl.allowed) return { ok: false, error: "Ya enviaste varias solicitudes. Probá más tarde." };
  const parsed = churchApplicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const d = parsed.data;
  try {
    const db = getDb();
    const base = slugify(d.name);
    const taken = await db
      .select({ slug: churches.slug })
      .from(churches)
      .where(or(eq(churches.slug, base), like(churches.slug, `${base}-%`)));
    const slug = uniqueSlug(base, new Set(taken.map((t) => t.slug)));
    const [row] = await db
      .insert(churches)
      .values({
        name: d.name,
        slug,
        generalLocation: d.generalLocation,
        description: d.description,
        doctrinalStatement: d.doctrinalStatement,
        website: d.website,
        status: "pending",
        // Datos de contacto para la verificación. `requestedBy`/`requestedRole`
        // definen a quién se le otorga el rol cuando la iglesia se verifica.
        contact: {
          email: d.contactEmail,
          ...(d.contactPhone ? { phone: d.contactPhone } : {}),
          requestedBy: actor.userId,
          requestedRole: d.role,
        },
      })
      .returning({ id: churches.id });
    await db.insert(auditLog).values({
      actorUserId: actor.userId,
      action: "church.apply",
      entity: "church",
      entityId: row!.id,
      churchId: row!.id,
    });
    revalidatePath("/admin/iglesias");
    return { ok: true, slug };
  } catch {
    return { ok: false, error: "No se pudo enviar la solicitud." };
  }
}

export async function requestMembership(churchId: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor.userId) return { ok: false, error: "Iniciá sesión para sumarte." };
  try {
    const db = getDb();
    const ok = await db
      .select({ id: churches.id })
      .from(churches)
      .where(and(eq(churches.id, churchId), eq(churches.status, "verified")))
      .limit(1);
    if (!ok[0]) return { ok: false, error: "Iglesia no disponible." };
    await db
      .insert(churchMembers)
      .values({ churchId, userId: actor.userId, status: "requested", linkedAt: new Date() })
      .onConflictDoUpdate({
        target: [churchMembers.churchId, churchMembers.userId],
        set: { status: "requested", linkedAt: new Date() },
        // No "degradar" a alguien ya activo.
        setWhere: or(eq(churchMembers.status, "left"), eq(churchMembers.status, "declined")),
      });
    revalidatePath("/perfil");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo enviar la solicitud." };
  }
}

export async function leaveChurch(churchId: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor.userId) return { ok: false, error: "No autenticado." };
  try {
    await getDb()
      .update(churchMembers)
      .set({ status: "left" })
      .where(and(eq(churchMembers.churchId, churchId), eq(churchMembers.userId, actor.userId)));
    revalidatePath("/perfil");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}

/** El equipo pastoral aprueba o rechaza una solicitud de membresía. */
export async function decideMembership(
  churchId: string,
  userId: string,
  decision: "active" | "declined" | "left",
): Promise<ActionResult> {
  const actor = await getActor();
  if (!can(actor, "church:manage_members", { churchId })) return { ok: false, error: "No autorizado." };
  try {
    const db = getDb();
    await db
      .update(churchMembers)
      .set({ status: decision })
      .where(and(eq(churchMembers.churchId, churchId), eq(churchMembers.userId, userId)));
    await db.insert(auditLog).values({
      actorUserId: actor.userId,
      action: `membership.${decision}`,
      entity: "church_member",
      entityId: null,
      churchId,
    });
    revalidatePath("/pastoral/miembros");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}
