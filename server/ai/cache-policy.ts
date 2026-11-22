/**
 * Política de la caché del asistente — funciones PURAS (testeables sin DB).
 *
 * Criterios de precisión (docs/06 §Caché, docs/13):
 * - Nunca se cachea ni se sirve desde caché una consulta personal, sensible,
 *   de crisis, de identidad, ni un turno que depende de la conversación previa.
 * - Umbral de similitud CONSERVADOR: ante la duda, se consulta al modelo.
 * - Solo se guardan respuestas cuyas citas fueron TODAS verificadas.
 */
import type { SafetyFlag } from "./safety";
import { extractCitations } from "./citations";

/** Umbral de similitud coseno (embeddings) para reutilizar una respuesta. */
export const SEMANTIC_THRESHOLD = 0.93;
/** Para la biblioteca curada (revisada por personas) se admite algo menos. */
export const LIBRARY_THRESHOLD = 0.9;
/** Prefiltro de trigramas: candidatos mínimamente parecidos en texto. */
export const TRIGRAM_PREFILTER = 0.25;

const MAX_CACHEABLE_LENGTH = 220;

/** Normaliza una pregunta para comparar: minúsculas, sin tildes ni signos. */
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!.,;:"'()«»“”\-–—]/g, " ")
    .replace(/^\s*(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches)\b[\s,]*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Señales de consulta personal: primera persona sobre la propia vida, vínculos
// cercanos, datos concretos. Conservador: ante la duda, NO es cacheable.
const PERSONAL_PATTERNS: RegExp[] = [
  /\b(me siento|siento que|estoy|estuve|tengo|tuve|me paso|me pasa|me duele|me cuesta|me dejo|me engano)\b/,
  /\b(mi|mis)\s+(esposo|esposa|marido|mujer|novio|novia|hijo|hija|hijos|padre|madre|papa|mama|hermano|hermana|familia|pareja|jefe|amigo|amiga|pastor|iglesia|vida|situacion|problema|caso|salud|trabajo|deuda|enfermedad)\b/,
  /\b(yo|conmigo)\b/,
  /\b(ayer|hoy|anoche|esta semana)\b/,
  /\d{2,}/, // edades, montos, fechas, teléfonos
  /@/, // correos
];

export function looksPersonal(normalized: string): boolean {
  return PERSONAL_PATTERNS.some((re) => re.test(normalized));
}

export type CacheEligibility =
  | { cacheable: true; normalized: string }
  | { cacheable: false; reason: string };

/**
 * ¿Esta consulta puede servirse o guardarse en caché?
 * `priorTurns` = mensajes previos en la conversación (0 = primera pregunta).
 */
export function cacheEligibility(
  question: string,
  flag: SafetyFlag,
  priorTurns: number,
): CacheEligibility {
  if (flag !== "none") return { cacheable: false, reason: `flag:${flag}` };
  if (priorTurns > 0) return { cacheable: false, reason: "contextual" };
  const normalized = normalizeQuestion(question);
  if (normalized.length < 8) return { cacheable: false, reason: "ambigua" };
  if (question.length > MAX_CACHEABLE_LENGTH) return { cacheable: false, reason: "larga" };
  // Las referencias bíblicas (p. ej. "Juan 3:16") no son datos personales.
  let withoutRefs = question;
  for (const c of extractCitations(question)) withoutRefs = withoutRefs.replace(c.raw, " ");
  if (looksPersonal(normalizeQuestion(withoutRefs))) {
    return { cacheable: false, reason: "personal" };
  }
  return { cacheable: true, normalized };
}

/** Similitud coseno entre dos vectores de igual dimensión. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export type Candidate<T> = T & { normalizedQuestion: string; embedding: number[] | null };

/**
 * Elige el mejor candidato: coincidencia exacta normalizada gana siempre; si
 * no, el de mayor similitud coseno que supere el umbral. Si no hay, `null`.
 */
export function pickBestMatch<T>(
  normalized: string,
  queryEmbedding: number[] | null,
  candidates: Candidate<T>[],
  threshold: number,
): { match: Candidate<T>; score: number } | null {
  const exact = candidates.find((c) => c.normalizedQuestion === normalized);
  if (exact) return { match: exact, score: 1 };
  if (!queryEmbedding) return null;
  let best: { match: Candidate<T>; score: number } | null = null;
  for (const c of candidates) {
    if (!c.embedding) continue;
    const score = cosineSimilarity(queryEmbedding, c.embedding);
    if (score >= threshold && (!best || score > best.score)) best = { match: c, score };
  }
  return best;
}

/** Solo se guardan respuestas con todas sus citas verificadas. */
export function isStorableAnswer(
  text: string,
  citations: { verified: boolean }[],
): boolean {
  if (text.trim().length < 40) return false;
  return citations.every((c) => c.verified);
}
