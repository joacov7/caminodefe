/**
 * Implementación del `LLMProvider` con OpenAI. Es el único archivo que conoce el
 * SDK de OpenAI; el resto del asistente depende solo de la interfaz.
 */
import "server-only";
import OpenAI from "openai";
import { env, requireEnv } from "@/lib/env";
import type {
  LLMProvider,
  GenerateOptions,
  GenerateResult,
} from "./provider";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  readonly model: string;
  private readonly embeddingModel: string;
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
    this.model = env.OPENAI_MODEL;
    this.embeddingModel = env.OPENAI_EMBEDDING_MODEL;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const res = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens,
      },
      { signal: options.signal },
    );
    return {
      text: res.choices[0]?.message?.content ?? "",
      usage: res.usage
        ? { tokensIn: res.usage.prompt_tokens, tokensOut: res.usage.completion_tokens }
        : undefined,
    };
  }

  async *stream(options: GenerateOptions): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens,
        stream: true,
      },
      { signal: options.signal },
    );
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: texts,
    });
    return res.data.map((d) => d.embedding);
  }
}
