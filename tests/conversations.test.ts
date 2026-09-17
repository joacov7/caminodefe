import { describe, it, expect } from "vitest";
import { conversationTitle } from "@/server/ai/conversation-title";

describe("conversationTitle", () => {
  it("usa el mensaje corto tal cual", () => {
    expect(conversationTitle("¿Qué es la gracia?")).toBe("¿Qué es la gracia?");
  });

  it("recorta mensajes largos con puntos suspensivos", () => {
    const long = "a".repeat(100);
    const title = conversationTitle(long);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("…")).toBe(true);
  });

  it("normaliza espacios y maneja vacío", () => {
    expect(conversationTitle("  hola   mundo  ")).toBe("hola mundo");
    expect(conversationTitle("   ")).toBe("Conversación");
  });
});
