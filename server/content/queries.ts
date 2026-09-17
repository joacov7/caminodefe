/**
 * Consultas de contenidos (server-side). Lo publicado es de lectura pública;
 * los borradores solo los ven quienes gestionan ese contenido.
 */
import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { contentItems } from "@/db/schema";

function dbOrNull() {
  try {
    return getDb();
  } catch {
    return null;
  }
}

export async function listPublishedContent(type?: string) {
  const db = dbOrNull();
  if (!db) return null;
  return db
    .select({
      id: contentItems.id,
      type: contentItems.type,
      title: contentItems.title,
      objective: contentItems.objective,
      origin: contentItems.origin,
      publishedAt: contentItems.publishedAt,
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.editorialStatus, "published"),
        type ? eq(contentItems.type, type) : undefined,
      ),
    )
    .orderBy(desc(contentItems.publishedAt))
    .limit(60);
}

export async function getPublishedContent(id: string) {
  const db = dbOrNull();
  if (!db) return null;
  const rows = await db
    .select()
    .from(contentItems)
    .where(
      and(eq(contentItems.id, id), eq(contentItems.editorialStatus, "published")),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Devocional del día: el devocional publicado más reciente. */
export async function getDevotionalOfDay() {
  const db = dbOrNull();
  if (!db) return null;
  const rows = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      passage: contentItems.passage,
      origin: contentItems.origin,
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.type, "devotional"),
        eq(contentItems.editorialStatus, "published"),
      ),
    )
    .orderBy(desc(contentItems.publishedAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Contenido de plataforma (churchId null) para el editor admin. */
export async function listPlatformContent() {
  const db = dbOrNull();
  if (!db) return null;
  return db
    .select({
      id: contentItems.id,
      type: contentItems.type,
      title: contentItems.title,
      origin: contentItems.origin,
      editorialStatus: contentItems.editorialStatus,
    })
    .from(contentItems)
    .where(isNull(contentItems.churchId))
    .orderBy(desc(contentItems.createdAt))
    .limit(200);
}
