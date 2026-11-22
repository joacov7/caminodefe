/**
 * Caché del asistente en dos capas (DB). La política vive en `cache-policy.ts`.
 *  1. Biblioteca curada (`answer_library`, estado `published`): respuestas
 *     revisadas y aprobadas por el consejo/moderación. Máxima prioridad.
 *  2. Caché por similitud (`answer_cache`): respuestas del modelo a preguntas
 *     generales, con citas verificadas. Invalidable en bloque.
 *
 * Prefiltro por trigramas (pg_trgm) y decisión final por similitud coseno de
 * embeddings en el servidor: portable (no requiere pgvector) y acotado a 20
 * candidatos por consulta.
 */
import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { answerCache, answerLibrary } from "@/db/schema";
import {
  LIBRARY_THRESHOLD,
  SEMANTIC_THRESHOLD,
  TRIGRAM_PREFILTER,
  pickBestMatch,
} from "./cache-policy";

export type CachedAnswer = {
  source: "library" | "cache";
  id: string;
  answer: string;
  score: number;
};

async function libraryCandidates(normalized: string) {
  return getDb()
    .select({
      id: answerLibrary.id,
      answer: answerLibrary.answer,
      normalizedQuestion: answerLibrary.normalizedQuestion,
      embedding: answerLibrary.embedding,
    })
    .from(answerLibrary)
    .where(
      and(
        eq(answerLibrary.status, "published"),
        isNull(answerLibrary.retiredAt),
        sql`similarity(${answerLibrary.normalizedQuestion}, ${normalized}) > ${TRIGRAM_PREFILTER}`,
      ),
    )
    .orderBy(desc(sql`similarity(${answerLibrary.normalizedQuestion}, ${normalized})`))
    .limit(20);
}

async function cacheCandidates(normalized: string) {
  return getDb()
    .select({
      id: answerCache.id,
      answer: answerCache.answer,
      normalizedQuestion: answerCache.normalizedQuestion,
      embedding: answerCache.embedding,
    })
    .from(answerCache)
    .where(
      and(
        isNull(answerCache.invalidatedAt),
        sql`similarity(${answerCache.normalizedQuestion}, ${normalized}) > ${TRIGRAM_PREFILTER}`,
      ),
    )
    .orderBy(desc(sql`similarity(${answerCache.normalizedQuestion}, ${normalized})`))
    .limit(20);
}

/**
 * Busca una respuesta reutilizable. `getEmbedding` se llama solo si no hay
 * coincidencia exacta (ahorra la llamada de embeddings en el caso frecuente).
 */
export async function findCachedAnswer(
  normalized: string,
  getEmbedding: () => Promise<number[] | null>,
): Promise<CachedAnswer | null> {
  const [lib, cache] = await Promise.all([
    libraryCandidates(normalized),
    cacheCandidates(normalized),
  ]);

  const exactLib = pickBestMatch(normalized, null, lib, LIBRARY_THRESHOLD);
  if (exactLib) return hit("library", exactLib.match, 1);
  const exactCache = pickBestMatch(normalized, null, cache, SEMANTIC_THRESHOLD);
  if (exactCache) return hit("cache", exactCache.match, 1);

  if (lib.length === 0 && cache.length === 0) return null;
  const embedding = await getEmbedding();
  if (!embedding) return null;

  const l = pickBestMatch(normalized, embedding, lib, LIBRARY_THRESHOLD);
  if (l) return hit("library", l.match, l.score);
  const c = pickBestMatch(normalized, embedding, cache, SEMANTIC_THRESHOLD);
  if (c) return hit("cache", c.match, c.score);
  return null;
}

async function hit(
  source: "library" | "cache",
  m: { id: string; answer: string },
  score: number,
): Promise<CachedAnswer> {
  const table = source === "library" ? answerLibrary : answerCache;
  await getDb()
    .update(table)
    .set({ hits: sql`${table.hits} + 1` })
    .where(eq(table.id, m.id));
  return { source, id: m.id, answer: m.answer, score };
}

export async function storeCachedAnswer(params: {
  normalized: string;
  embedding: number[];
  answer: string;
  model: string;
}) {
  await getDb()
    .insert(answerCache)
    .values({
      normalizedQuestion: params.normalized,
      embedding: params.embedding,
      answer: params.answer,
      model: params.model,
    })
    // Si existía (p. ej. invalidada), se reemplaza por la respuesta nueva.
    .onConflictDoUpdate({
      target: answerCache.normalizedQuestion,
      set: {
        embedding: params.embedding,
        answer: params.answer,
        model: params.model,
        invalidatedAt: null,
        hits: 0,
        createdAt: new Date(),
      },
    });
}

/** Invalida TODA la caché por similitud (p. ej. cambió la declaración doctrinal). */
export async function invalidateAnswerCache(): Promise<number> {
  const rows = await getDb()
    .update(answerCache)
    .set({ invalidatedAt: new Date() })
    .where(isNull(answerCache.invalidatedAt))
    .returning({ id: answerCache.id });
  return rows.length;
}
