/**
 * Esquemas de validación de "Mi Camino" (puros y testeables).
 */
import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().max(120).optional(),
  body: z.string().min(1, "La nota no puede estar vacía.").max(5000),
  linkedRef: z.string().max(60).optional(),
});

export const journalSchema = z.object({
  entry: z.string().min(1, "La entrada no puede estar vacía.").max(5000),
});

export const favoriteSchema = z.object({
  refType: z.enum(["bible_chapter", "bible_verse", "content"]),
  refId: z.string().min(1).max(120),
  label: z.string().max(160).optional(),
});

export type NoteInput = z.infer<typeof noteSchema>;
export type JournalInput = z.infer<typeof journalSchema>;
export type FavoriteInput = z.infer<typeof favoriteSchema>;
