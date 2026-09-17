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
 * Selecciona el proveedor configurado (OpenAI). Lanza un error claro si falta la
 * API key, evitando "falsos verdes": el asistente no responde sin credenciales.
 * La carga del adapter es diferida para no importar el SDK en entornos que no lo
 * usan (p. ej. tests que inyectan un proveedor falso).
 */
export async function getLLMProvider(): Promise<LLMProvider> {
  const { OpenAIProvider } = await import("./openai-provider");
  return new OpenAIProvider();
}
