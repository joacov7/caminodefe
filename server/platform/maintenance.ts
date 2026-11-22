/**
 * Mantenimiento diario: aplica la política de retención (docs/15).
 * - Conversaciones borradas por su dueño hace > 30 días: purga física
 *   (sus mensajes y citas se borran en cascada).
 * - Sesiones y tokens de verificación vencidos.
 * - Ventanas de rate limiting de más de 24 h.
 * Devuelve solo CONTEOS (sin datos personales).
 */
import "server-only";
import { and, isNotNull, lt } from "drizzle-orm";
import { getDb, withMaintenanceContext } from "@/db";
import { auditLog, conversations, rateLimits, sessions, verificationTokens } from "@/db/schema";

export const CONVERSATION_RETENTION_DAYS = 30;

export async function runMaintenance(now: Date = new Date()) {
  const db = getDb();
  const cutoff = new Date(now.getTime() - CONVERSATION_RETENTION_DAYS * 86_400_000);
  const [purged] = await withMaintenanceContext((d) => [
    d
      .delete(conversations)
      .where(and(isNotNull(conversations.deletedAt), lt(conversations.deletedAt, cutoff)))
      .returning({ id: conversations.id }),
  ]);
  const expiredSessions = await db.delete(sessions).where(lt(sessions.expires, now)).returning({ t: sessions.sessionToken });
  const expiredTokens = await db
    .delete(verificationTokens)
    .where(lt(verificationTokens.expires, now))
    .returning({ t: verificationTokens.token });
  const oldWindows = await db
    .delete(rateLimits)
    .where(lt(rateLimits.windowStart, new Date(now.getTime() - 86_400_000)))
    .returning({ k: rateLimits.key });
  const summary = {
    conversationsPurged: purged.length,
    sessionsExpired: expiredSessions.length,
    tokensExpired: expiredTokens.length,
    rateLimitWindows: oldWindows.length,
  };
  await db.insert(auditLog).values({ action: "maintenance.run", entity: "platform", metadata: summary });
  return summary;
}
