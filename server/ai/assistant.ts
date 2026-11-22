/**
 * Orquestación del asistente bíblico. Orden NO negociable:
 *   1. Seguridad: ante crisis se responde con ayuda humana, SIN modelo y SIN
 *      límite de plan (docs/06 G.3: nunca se bloquea el acceso a emergencias).
 *   2. Biblioteca curada / caché (solo consultas generales elegibles).
 *   3. Límite del plan (solo si hace falta llamar al modelo).
 *   4. RAG + modelo + verificación de citas.
 * Todas las dependencias se inyectan para probar el flujo sin OpenAI ni DB.
 */
import type { LLMProvider, ChatMessage } from "./provider";
import { detectSafetyFlag, buildCrisisResponse, type SafetyFlag } from "./safety";
import { buildSystemMessages } from "./prompt";
import { formatContext, type RetrievedPassage } from "./rag";
import {
  extractCitations,
  verifyCitations,
  type CitationCheck,
} from "./citations";
import { cacheEligibility, isStorableAnswer } from "./cache-policy";
import type { CachedAnswer } from "./cache";
import type { BibleBook } from "@/lib/bible/books";

export type AnswerSource = "crisis" | "library" | "cache" | "model" | "limit";

export type LimitCheck = { allowed: boolean; remaining: number; limit: number };

export type AssistantDeps = {
  provider: LLMProvider;
  retrieve: (query: string) => Promise<RetrievedPassage[]>;
  verseExists: (book: BibleBook, chapter: number, verse: number) => Promise<boolean>;
  country?: string;
  /** Se consulta SOLO si hay que llamar al modelo. */
  checkLimit?: () => Promise<LimitCheck>;
  cache?: {
    find: (
      normalized: string,
      getEmbedding: () => Promise<number[] | null>,
    ) => Promise<CachedAnswer | null>;
    store: (p: {
      normalized: string;
      embedding: number[];
      answer: string;
      model: string;
    }) => Promise<void>;
  };
};

export type AssistantResult = {
  flag: SafetyFlag;
  source: AnswerSource;
  text: string;
  citations: CitationCheck[];
  /** true si el modelo no se ejecutó (crisis, caché, biblioteca o límite). */
  bypassedModel: boolean;
  usage?: { tokensIn: number; tokensOut: number };
  limit?: LimitCheck;
};

function lastUserIndex(messages: ChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.role === "user") return i;
  }
  return -1;
}

/** Pregunta demasiado breve o vaga para responder bien sin aclarar. */
export function isAmbiguous(question: string): boolean {
  const words = question
    .toLowerCase()
    .replace(/[¿?¡!.,;:]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return true;
  if (extractCitations(question).length > 0) return false;
  return words.length <= 2;
}

const AMBIGUITY_NOTE =
  "La pregunta es breve o ambigua. Antes de dar una respuesta extensa, " +
  "pedí con amabilidad una aclaración (qué quiere saber, en qué contexto) y " +
  "ofrecé 2 o 3 opciones concretas de lo que podría estar preguntando.";

const IDENTITY_NOTE =
  "La persona pregunta por tu identidad: respondé primero, con claridad y " +
  "humildad, que sos una herramienta de orientación y estudio, no Dios, " +
  "Jesús, un profeta ni un pastor.";

/** Aviso transparente cuando el modelo citó algo que no se pudo verificar. */
export function unverifiedNotice(citations: CitationCheck[]): string | null {
  const bad = citations.filter((c) => !c.verified).map((c) => c.raw);
  if (bad.length === 0) return null;
  const list = [...new Set(bad)].join(", ");
  return (
    `\n\n⚠️ No pude verificar esta(s) referencia(s) en el texto bíblico: ${list}. ` +
    "Tomala(s) con cautela y revisalas en tu Biblia."
  );
}

export async function runAssistant(
  messages: ChatMessage[],
  deps: AssistantDeps,
): Promise<AssistantResult> {
  const idx = lastUserIndex(messages);
  const question = idx >= 0 ? messages[idx]!.content : "";
  const flag = detectSafetyFlag(question);

  // 1. Seguridad primero: ante crisis, no se consulta al modelo ni al límite.
  if (flag === "crisis") {
    return {
      flag,
      source: "crisis",
      text: buildCrisisResponse(deps.country ?? "AR"),
      citations: [],
      bypassedModel: true,
    };
  }

  // 2. Biblioteca curada / caché (solo preguntas generales, primer turno).
  const eligibility = cacheEligibility(question, flag, idx);
  let embedding: number[] | null = null;
  const getEmbedding = async () => {
    if (embedding) return embedding;
    try {
      embedding = (await deps.provider.embed([question]))[0] ?? null;
    } catch {
      embedding = null; // sin embeddings: solo coincidencia exacta
    }
    return embedding;
  };

  if (eligibility.cacheable && deps.cache) {
    const hit = await deps.cache.find(eligibility.normalized, getEmbedding).catch(() => null);
    if (hit) {
      const citations = await verifyCitations(extractCitations(hit.answer), deps.verseExists);
      return {
        flag,
        source: hit.source,
        text: hit.answer,
        citations,
        bypassedModel: true,
      };
    }
  }

  // 3. Límite del plan.
  const limit = deps.checkLimit ? await deps.checkLimit() : undefined;
  if (limit && !limit.allowed) {
    return {
      flag,
      source: "limit",
      text:
        "Alcanzaste el límite diario de consultas de tu plan. Podés volver mañana. " +
        "La Biblia, los devocionales, el camino guiado y el contacto con un pastor " +
        "siguen disponibles sin límite.",
      citations: [],
      bypassedModel: true,
      limit,
    };
  }

  // 4. RAG + modelo.
  const passages = await deps.retrieve(question);
  const notes = [
    flag === "identity_challenge" ? IDENTITY_NOTE : null,
    isAmbiguous(question) ? AMBIGUITY_NOTE : null,
  ].filter((n): n is string => n !== null);
  const system = buildSystemMessages(formatContext(passages), notes);

  const finalMessages: ChatMessage[] = [{ role: "system", content: system }, ...messages];
  const result = await deps.provider.generate({ messages: finalMessages });
  const citations = await verifyCitations(extractCitations(result.text), deps.verseExists);

  if (eligibility.cacheable && deps.cache && isStorableAnswer(result.text, citations)) {
    const emb = await getEmbedding();
    if (emb && emb.length > 0) {
      await deps.cache
        .store({
          normalized: eligibility.normalized,
          embedding: emb,
          answer: result.text,
          model: deps.provider.model,
        })
        .catch(() => undefined);
    }
  }

  const notice = unverifiedNotice(citations);
  return {
    flag,
    source: "model",
    text: notice ? result.text + notice : result.text,
    citations,
    bypassedModel: false,
    usage: result.usage,
    limit,
  };
}
