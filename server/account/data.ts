/**
 * Derechos sobre los datos personales (Ley 25.326 — acceso y supresión):
 * exportar todo lo propio y eliminar la cuenta. Política en docs/15.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { getDb, withUserContext } from "@/db";
import {
  users,
  userNotes,
  userJournal,
  userFavorites,
  conversations,
  messages,
  guidedPathProgress,
  readingPlanDays,
  reminderPrefs,
  contactRequests,
  contributions,
  subscriptions,
  churchMembers,
  auditLog,
} from "@/db/schema";
import { inArray } from "drizzle-orm";

/** Todos los datos del usuario en un objeto JSON portable. */
export async function exportUserData(userId: string) {
  const db = getDb();
  const [profile, contacts, gifts, subs, memberships] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, locale: users.locale, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId)),
    db.select().from(contactRequests).where(eq(contactRequests.userId, userId)),
    db.select().from(contributions).where(eq(contributions.userId, userId)),
    db.select().from(subscriptions).where(eq(subscriptions.userId, userId)),
    db.select().from(churchMembers).where(eq(churchMembers.userId, userId)),
  ]);
  const [notes, journal, favorites, convs, path, plans, reminders] = await withUserContext(userId, (d) => [
    d.select().from(userNotes).where(eq(userNotes.userId, userId)),
    d.select().from(userJournal).where(eq(userJournal.userId, userId)),
    d.select().from(userFavorites).where(eq(userFavorites.userId, userId)),
    d.select().from(conversations).where(eq(conversations.userId, userId)),
    d.select().from(guidedPathProgress).where(eq(guidedPathProgress.userId, userId)),
    d.select().from(readingPlanDays).where(eq(readingPlanDays.userId, userId)),
    d.select().from(reminderPrefs).where(eq(reminderPrefs.userId, userId)),
  ]);
  const convIds = convs.map((c) => c.id);
  const msgs = convIds.length
    ? (
        await withUserContext(userId, (d) => [
          d.select().from(messages).where(inArray(messages.conversationId, convIds)),
        ])
      )[0]
    : [];
  return {
    exportedAt: new Date().toISOString(),
    notice:
      "Exportación de tus datos en Camino de Fe. Contiene información privada: guardala en un lugar seguro.",
    profile: profile[0] ?? null,
    notes,
    journal,
    favorites,
    conversations: convs.map((c) => ({ ...c, messages: msgs.filter((m) => m.conversationId === c.id) })),
    guidedPath: path,
    readingPlans: plans,
    reminders,
    contactRequests: contacts,
    contributions: gifts,
    subscriptions: subs,
    churchMemberships: memberships,
  };
}

/**
 * Elimina la cuenta y, en cascada, todos sus datos personales. Se deja un
 * registro de auditoría SIN datos personales (el actor queda en null por FK).
 */
export async function deleteUserAccount(userId: string) {
  const db = getDb();
  await db.insert(auditLog).values({
    actorUserId: userId,
    action: "account.delete",
    entity: "user",
    entityId: null,
  });
  await db.delete(users).where(eq(users.id, userId));
}
