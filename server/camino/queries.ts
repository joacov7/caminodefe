/**
 * Consultas de "Mi Camino" (server-side, privadas por dueño). Reciben el
 * `userId` ya autenticado. Devuelven [] si la base no está configurada.
 */
import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userNotes, userJournal, userFavorites } from "@/db/schema";

function dbOrNull() {
  try {
    return getDb();
  } catch {
    return null;
  }
}

export async function listNotes(userId: string) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select()
    .from(userNotes)
    .where(eq(userNotes.userId, userId))
    .orderBy(desc(userNotes.updatedAt))
    .limit(200);
}

export async function listJournal(userId: string) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select()
    .from(userJournal)
    .where(eq(userJournal.userId, userId))
    .orderBy(desc(userJournal.createdAt))
    .limit(200);
}

export async function listFavorites(userId: string) {
  const db = dbOrNull();
  if (!db) return [];
  return db
    .select()
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId))
    .orderBy(desc(userFavorites.createdAt))
    .limit(200);
}
