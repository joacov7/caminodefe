/**
 * Interfaz del proveedor de modelo de lenguaje (LLM), desacoplada del proveedor
 * concreto. La lógica del asistente depende SOLO de esta interfaz; cambiar de
 * OpenAI a otro proveedor no debe requerir tocar el resto del código.
 *
 * La implementación concreta (OpenAI) se agrega en el Paso 3; aquí se define el
 * contrato para que el andamiaje quede tipado y testeable.
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateOptions = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

export type GenerateResult = {
  text: string;
  usage?: {
    tokensIn: number;
    tokensOut: number;
  };
};

export interface LLMProvider {
  readonly name: string;
  readonly model: string;

  /** Respuesta completa (no streaming). */
  generate(options: GenerateOptions): Promise<GenerateResult>;

  /** Respuesta en streaming, como iterable de fragmentos de texto. */
  stream(options: GenerateOptions): AsyncIterable<string>;

  /** Embeddings para RAG. */
  embed(texts: string[]): Promise<number[][]>;
}

/**
 * Selecciona el proveedor configurado. Por ahora solo lanza un error claro si se
 * intenta usar antes de implementar el adapter de OpenAI (Paso 3), evitando
 * "falsos verdes": el asistente NO está conectado todavía.
 */
export function getLLMProvider(): LLMProvider {
  throw new Error(
    "El proveedor de IA (OpenAI) aún no está implementado (Paso 3). " +
      "Configurá OPENAI_API_KEY y completá el adapter antes de usar el asistente.",
  );
}
