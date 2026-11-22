import { describe, it, expect } from "vitest";
import { runAssistant, isAmbiguous, unverifiedNotice, type AssistantDeps } from "@/server/ai/assistant";
import {
  cacheEligibility,
  normalizeQuestion,
  cosineSimilarity,
  pickBestMatch,
  isStorableAnswer,
  SEMANTIC_THRESHOLD,
} from "@/server/ai/cache-policy";
import { estimateCostMicros, priceFor } from "@/server/ai/costs";
import { buildCrisisResponse } from "@/server/ai/safety";
import type { LLMProvider, GenerateOptions } from "@/server/ai/provider";

function provider(text = "Juan 3:16 dice que Dios amó al mundo. Esta es una interpretación general.") {
  const calls: GenerateOptions[] = [];
  const p: LLMProvider & { calls: GenerateOptions[]; embeds: number } = {
    name: "mock",
    model: "gpt-4o-mini",
    calls,
    embeds: 0,
    async generate(o) {
      calls.push(o);
      return { text, usage: { tokensIn: 1000, tokensOut: 200 } };
    },
    async *stream() {},
    async embed() {
      p.embeds++;
      return [[1, 0, 0]];
    },
  };
  return p;
}

function deps(over: Partial<AssistantDeps> = {}): AssistantDeps {
  return {
    provider: provider(),
    retrieve: async () => [],
    verseExists: async () => true,
    ...over,
  };
}

describe("asistente — seguridad, límite y caché", () => {
  it("CRISIS con el cupo agotado: responde con ayuda y ni consulta el límite", async () => {
    let limitChecked = false;
    const r = await runAssistant([{ role: "user", content: "ya no quiero vivir" }], deps({
      checkLimit: async () => {
        limitChecked = true;
        return { allowed: false, remaining: 0, limit: 15 };
      },
    }));
    expect(r.source).toBe("crisis");
    expect(r.text).toMatch(/135/);
    expect(limitChecked).toBe(false);
  });

  it("sin cupo y consulta normal: devuelve 'limit' sin llamar al modelo", async () => {
    const p = provider();
    const r = await runAssistant([{ role: "user", content: "¿Qué significa la gracia?" }], deps({
      provider: p,
      checkLimit: async () => ({ allowed: false, remaining: 0, limit: 15 }),
    }));
    expect(r.source).toBe("limit");
    expect(p.calls).toHaveLength(0);
  });

  it("respuesta curada: se sirve sin modelo y sin consumir cupo", async () => {
    const p = provider();
    let limitChecked = false;
    const r = await runAssistant([{ role: "user", content: "¿Qué es la gracia de Dios?" }], deps({
      provider: p,
      checkLimit: async () => ((limitChecked = true), { allowed: true, remaining: 5, limit: 15 }),
      cache: {
        find: async () => ({ source: "library", id: "1", answer: "La gracia… (Efesios 2:8)", score: 1 }),
        store: async () => undefined,
      },
    }));
    expect(r.source).toBe("library");
    expect(p.calls).toHaveLength(0);
    expect(limitChecked).toBe(false);
    expect(r.citations[0]?.raw).toBe("Efesios 2:8");
  });

  it("una consulta PERSONAL nunca se busca ni se guarda en caché", async () => {
    let finds = 0;
    let stores = 0;
    await runAssistant([{ role: "user", content: "Mi esposo me dejó, ¿qué dice la Biblia?" }], deps({
      cache: { find: async () => (finds++, null), store: async () => void stores++ },
    }));
    expect(finds).toBe(0);
    expect(stores).toBe(0);
  });

  it("una pregunta general nueva se responde con el modelo y se guarda", async () => {
    const stored: string[] = [];
    const r = await runAssistant([{ role: "user", content: "¿Qué enseña Juan 3:16 sobre el amor de Dios?" }], deps({
      cache: { find: async () => null, store: async (x) => void stored.push(x.normalized) },
    }));
    expect(r.source).toBe("model");
    expect(stored).toEqual(["que ensena juan 3 16 sobre el amor de dios"]);
  });

  it("no guarda respuestas con citas no verificadas y avisa al usuario", async () => {
    const stored: string[] = [];
    const r = await runAssistant([{ role: "user", content: "¿Qué dice Juan 99:1 sobre la fe?" }], deps({
      provider: provider("Según Juan 99:1, la fe mueve montañas, y esto es una interpretación."),
      verseExists: async () => false,
      cache: { find: async () => null, store: async (x) => void stored.push(x.normalized) },
    }));
    expect(stored).toHaveLength(0);
    expect(r.text).toMatch(/No pude verificar/);
  });

  it("turnos de seguimiento (contextuales) no usan caché", async () => {
    let finds = 0;
    await runAssistant(
      [
        { role: "user", content: "¿Qué es la fe?" },
        { role: "assistant", content: "La fe es…" },
        { role: "user", content: "¿Y cómo la pongo en práctica?" },
      ],
      deps({ cache: { find: async () => (finds++, null), store: async () => undefined } }),
    );
    expect(finds).toBe(0);
  });

  it("pregunta ambigua: el prompt pide aclaración", async () => {
    const p = provider();
    await runAssistant([{ role: "user", content: "pecado" }], deps({ provider: p }));
    expect(p.calls[0]!.messages[0]!.content).toMatch(/aclaración/);
    expect(isAmbiguous("Juan 3")).toBe(false);
    expect(isAmbiguous("¿Qué enseña la Biblia sobre el perdón?")).toBe(false);
  });
});

describe("política de caché (pura)", () => {
  it("normaliza tildes, signos y saludos", () => {
    expect(normalizeQuestion("Hola, ¿Qué es la GRACIA?")).toBe("que es la gracia");
  });
  it("elegibilidad conservadora", () => {
    expect(cacheEligibility("¿Qué es la gracia?", "none", 0).cacheable).toBe(true);
    expect(cacheEligibility("Me siento solo, ¿qué hago?", "none", 0).cacheable).toBe(false);
    expect(cacheEligibility("Tengo 45 años y dudas", "none", 0).cacheable).toBe(false);
    expect(cacheEligibility("¿Sos Dios?", "identity_challenge", 0).cacheable).toBe(false);
    expect(cacheEligibility("¿Qué es la gracia?", "none", 2).cacheable).toBe(false);
  });
  it("coseno y selección con umbral", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    const cands = [
      { id: "a", normalizedQuestion: "x", embedding: [1, 0] },
      { id: "b", normalizedQuestion: "y", embedding: [0.8, 0.6] },
    ];
    expect(pickBestMatch("z", [1, 0.01], cands, SEMANTIC_THRESHOLD)?.match.id).toBe("a");
    expect(pickBestMatch("z", [0, 1], cands, SEMANTIC_THRESHOLD)).toBeNull();
    expect(pickBestMatch("y", null, cands, SEMANTIC_THRESHOLD)?.match.id).toBe("b");
  });
  it("solo almacena respuestas con citas verificadas", () => {
    const long = "x".repeat(50);
    expect(isStorableAnswer(long, [{ verified: true }])).toBe(true);
    expect(isStorableAnswer(long, [{ verified: false }])).toBe(false);
    expect(isStorableAnswer("corta", [])).toBe(false);
  });
  it("aviso de citas no verificadas", () => {
    expect(unverifiedNotice([])).toBeNull();
  });
});

describe("costos y recursos", () => {
  it("estima el costo en micro-USD", () => {
    // 1000 × 0,15 + 200 × 0,60 = 270 micro-USD
    expect(estimateCostMicros("gpt-4o-mini", 1000, 200)).toBe(270);
    expect(priceFor("gpt-4o-mini-2024-07-18").inputPerM).toBe(0.15);
    expect(priceFor("desconocido").outputPerM).toBe(10); // conservador
  });
  it("la respuesta de crisis siempre ofrece una vía de ayuda", () => {
    expect(buildCrisisResponse("AR")).toMatch(/144/);
    expect(buildCrisisResponse("ZZ")).toMatch(/emergencias de tu país/);
  });
});
