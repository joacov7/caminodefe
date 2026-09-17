/**
 * Consultas de facturación (server-side). Reciben el `userId` autenticado.
 */
import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { subscriptions, contributions } from "@/db/schema";

function dbOrNull() {
  try {
    return getDb();
  } catch {
    return null;
  }
}

/** Plan vigente del usuario (por defecto "free"). */
export async function getUserPlanId(userId: string): Promise<string> {
  const db = dbOrNull();
  if (!db) return "free";
  const rows = await db
    .select({ planId: subscriptions.planId, status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  const sub = rows[0];
  if (!sub || sub.status !== "active") return "free";
  return sub.planId;
}

export async function listMyContributions(userId: string) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select()
    .from(contributions)
    .where(eq(contributions.userId, userId))
    .orderBy(desc(contributions.createdAt))
    .limit(100);
}
