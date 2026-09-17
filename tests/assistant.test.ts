import { describe, it, expect } from "vitest";
import { detectSafetyFlag, buildCrisisResponse } from "@/server/ai/safety";
import { extractCitations, verifyCitations } from "@/server/ai/citations";
import { checkDailyLimit, usageDay } from "@/server/ai/limits";
import { runAssistant } from "@/server/ai/assistant";
import type { LLMProvider, GenerateOptions, ChatMessage } from "@/server/ai/provider";
import type { BibleBook } from "@/lib/bible/books";

// --- Guardarraíles de seguridad ---
describe("safety", () => {
  it("detecta señales de crisis", () => {
    expect(detectSafetyFlag("ya no quiero vivir")).toBe("crisis");
    expect(detectSafetyFlag("estoy pensando en suicidarme")).toBe("crisis");
  });
  it("detecta desafíos de identidad", () => {
    expect(detectSafetyFlag("¿sos Dios?")).toBe("identity_challenge");
  });
  it("no marca preguntas normales", () => {
    expect(detectSafetyFlag("¿qué enseña la Biblia sobre el perdón?")).toBe("none");
  });
  it("la respuesta de crisis incluye recursos de emergencia", () => {
    const text = buildCrisisResponse("AR");
    expect(text).toMatch(/911/);
    expect(text.toLowerCase()).toContain("ayuda");
  });
});

// --- Citas ---
describe("citations", () => {
  it("extrae referencias con y sin versículo y con rangos", () => {
    const found = extractCitations(
      "Ver Juan 3:16, también 1 Corintios 13:4-7 y el Salmos 23.",
    );
    const raws = found.map((c) => c.raw.replace(/\s+/g, " "));
    expect(raws).toContain("Juan 3:16");
    expect(raws.some((r) => r.startsWith("1 Corintios 13:4"))).toBe(true);
    expect(raws).toContain("Salmos 23");
    const cor = found.find((c) => c.book.slug === "1-corintios")!;
    expect(cor.verseStart).toBe(4);
    expect(cor.verseEnd).toBe(7);
  });

  it("marca como no verificada una cita fuera de rango de capítulos", async () => {
    const cites = extractCitations("Juan 99:1"); // Juan tiene 21 capítulos
    const checked = await verifyCitations(cites, async () => true);
    expect(checked[0]!.verified).toBe(false);
  });

  it("verifica el versículo contra el corpus (lookup inyectado)", async () => {
    const cites = extractCitations("Juan 3:16 y Juan 3:999");
    const exists = async (_b: BibleBook, _c: number, v: number) => v === 16;
    const checked = await verifyCitations(cites, exists);
    expect(checked.find((c) => c.verseStart === 16)!.verified).toBe(true);
    expect(checked.find((c) => c.verseStart === 999)!.verified).toBe(false);
  });
});

// --- Límites ---
describe("limits", () => {
  it("aplica el límite del plan gratuito", () => {
    expect(checkDailyLimit("free", 14).allowed).toBe(true);
    expect(checkDailyLimit("free", 15).allowed).toBe(false);
    expect(checkDailyLimit("premium", 15).allowed).toBe(true);
  });
  it("usageDay devuelve YYYY-MM-DD", () => {
    expect(usageDay(new Date("2026-09-17T10:00:00Z"))).toBe("2026-09-17");
  });
});

// --- Orquestación ---
function mockProvider(): LLMProvider & { calls: GenerateOptions[] } {
  const calls: GenerateOptions[] = [];
  return {
    name: "mock",
    model: "mock",
    calls,
    async generate(opts) {
      calls.push(opts);
      return {
        text: "El texto dice en Juan 3:16 que Dios amó al mundo. Esta es mi interpretación.",
        usage: { tokensIn: 10, tokensOut: 20 },
      };
    },
    async *stream() {
      yield "";
    },
    async embed() {
      return [[]];
    },
  };
}

describe("runAssistant", () => {
  it("ante crisis, NO llama al modelo y responde con recursos", async () => {
    const provider = mockProvider();
    const result = await runAssistant(
      [{ role: "user", content: "quiero morirme" }],
      {
        provider,
        retrieve: async () => [],
        verseExists: async () => true,
      },
    );
    expect(result.flag).toBe("crisis");
    expect(result.bypassedModel).toBe(true);
    expect(provider.calls).toHaveLength(0);
    expect(result.text).toMatch(/911/);
  });

  it("consulta normal: recupera contexto, llama al modelo y verifica citas", async () => {
    const provider = mockProvider();
    const messages: ChatMessage[] = [
      { role: "user", content: "Explicame Juan 3:16" },
    ];
    const result = await runAssistant(messages, {
      provider,
      retrieve: async () => [{ ref: "Juan 3:16", text: "Porque de tal manera…" }],
      verseExists: async (_b, _c, v) => v === 16,
    });

    expect(result.bypassedModel).toBe(false);
    // El primer mensaje enviado al modelo es el system con el contexto RAG.
    const sent = provider.calls[0]!.messages;
    expect(sent[0]!.role).toBe("system");
    expect(sent[0]!.content).toContain("Juan 3:16");
    // La cita de la respuesta queda verificada.
    const cite = result.citations.find((c) => c.raw === "Juan 3:16")!;
    expect(cite.verified).toBe(true);
    expect(result.usage).toEqual({ tokensIn: 10, tokensOut: 20 });
  });
});
