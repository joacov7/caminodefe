import { describe, it, expect } from "vitest";
import { qrPath, qrSvg } from "@/lib/qr";

describe("QR de invitación", () => {
  it("genera una matriz cuadrada válida y determinista", () => {
    const a = qrPath("https://caminodefe.app/i/iglesia-nueva-vida");
    expect(a.size).toBeGreaterThanOrEqual(21);
    expect((a.size - 17) % 4).toBe(0); // tamaños válidos: 21, 25, 29…
    expect(a.path.length).toBeGreaterThan(100);
    expect(qrPath("https://caminodefe.app/i/iglesia-nueva-vida")).toEqual(a);
  });
  it("el SVG escapa la etiqueta y tiene margen", () => {
    const svg = qrSvg("https://x/i/a", { label: 'Iglesia <"A">' });
    expect(svg).toContain('aria-label="Iglesia A"');
    expect(svg).toContain('translate(4 4)');
  });
});
