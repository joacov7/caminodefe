/**
 * Orquestación del asistente bíblico. Combina guardarraíles, RAG, el modelo y la
 * verificación de citas. Todas las dependencias se inyectan para poder probar el
 * flujo completo sin llamar a OpenAI ni a la base de datos.
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
import type { BibleBook } from "@/lib/bible/books";

export type AssistantDeps = {
  provider: LLMProvider;
  retrieve: (query: string) => Promise<RetrievedPassage[]>;
  verseExists: (book: BibleBook, chapter: number, verse: number) => Promise<boolean>;
  country?: string;
};

export type AssistantResult = {
  flag: SafetyFlag;
  text: string;
  citations: CitationCheck[];
  /** true si el modelo no se ejecutó (respuesta de crisis por seguridad). */
  bypassedModel: boolean;
  usage?: { tokensIn: number; tokensOut: number };
};

function lastUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.role === "user") return messages[i]!.content;
  }
  return "";
}

export async function runAssistant(
  messages: ChatMessage[],
  deps: AssistantDeps,
): Promise<AssistantResult> {
  const question = lastUserMessage(messages);
  const flag = detectSafetyFlag(question);

  // Seguridad primero: ante crisis, no se consulta al modelo.
  if (flag === "crisis") {
    return {
      flag,
      text: buildCrisisResponse(deps.country ?? "AR"),
      citations: [],
      bypassedModel: true,
    };
  }

  const passages = await deps.retrieve(question);
  const system = buildSystemMessages(formatContext(passages));

  const finalMessages: ChatMessage[] = [
    { role: "system", content: system },
    ...messages,
  ];

  const result = await deps.provider.generate({ messages: finalMessages });
  const citations = await verifyCitations(
    extractCitations(result.text),
    deps.verseExists,
  );

  return {
    flag,
    text: result.text,
    citations,
    bypassedModel: false,
    usage: result.usage,
  };
}
