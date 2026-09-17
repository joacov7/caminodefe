"use server";

/**
 * Server actions de "Mi Camino". Toda acción exige sesión y opera SOLO sobre los
 * datos del propio usuario (privacidad no negociable). La autorización se valida
 * en el servidor; la ausencia de sesión corta antes de tocar la DB.
 */
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userNotes, userJournal, userFavorites } from "@/db/schema";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import {
  noteSchema,
  journalSchema,
  favoriteSchema,
  type NoteInput,
  type JournalInput,
  type FavoriteInput,
} from "./validation";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireUserId(): Promise<string | null> {
  const actor = await getActor();
  return can(actor, "notes:manage_own") ? actor.userId : null;
}

// --- Notas ---
export async function createNote(input: NoteInput): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Necesitás iniciar sesión." };
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  try {
    await getDb().insert(userNotes).values({ userId, ...parsed.data });
    revalidatePath("/mi-camino");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la nota." };
  }
}

export async function deleteNote(noteId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autenticado." };
  try {
    // El filtro por userId garantiza que solo se borra lo propio.
    await getDb()
      .delete(userNotes)
      .where(and(eq(userNotes.id, noteId), eq(userNotes.userId, userId)));
    revalidatePath("/mi-camino");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la nota." };
  }
}

// --- Diario ---
export async function addJournalEntry(input: JournalInput): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Necesitás iniciar sesión." };
  const parsed = journalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  try {
    await getDb().insert(userJournal).values({ userId, entry: parsed.data.entry });
    revalidatePath("/mi-camino");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la entrada." };
  }
}

export async function deleteJournalEntry(entryId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autenticado." };
  try {
    await getDb()
      .delete(userJournal)
      .where(and(eq(userJournal.id, entryId), eq(userJournal.userId, userId)));
    revalidatePath("/mi-camino");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la entrada." };
  }
}

// --- Favoritos ---
export async function toggleFavorite(
  input: FavoriteInput,
): Promise<ActionResult<{ favorited: boolean }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Necesitás iniciar sesión." };
  const parsed = favoriteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  try {
    const db = getDb();
    const existing = await db
      .select({ id: userFavorites.id })
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.refType, parsed.data.refType),
          eq(userFavorites.refId, parsed.data.refId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db.delete(userFavorites).where(eq(userFavorites.id, existing[0].id));
      revalidatePath("/mi-camino");
      return { ok: true, data: { favorited: false } };
    }
    await db.insert(userFavorites).values({ userId, ...parsed.data });
    revalidatePath("/mi-camino");
    return { ok: true, data: { favorited: true } };
  } catch {
    return { ok: false, error: "No se pudo actualizar el favorito." };
  }
}

export async function removeFavorite(favoriteId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autenticado." };
  try {
    await getDb()
      .delete(userFavorites)
      .where(
        and(eq(userFavorites.id, favoriteId), eq(userFavorites.userId, userId)),
      );
    revalidatePath("/mi-camino");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el favorito." };
  }
}
