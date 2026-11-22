/**
 * Estimación de costo por consulta de IA (micro-USD), para medir el costo por
 * usuario — la métrica que define la viabilidad del negocio (docs/13 §5.4).
 *
 * Precios de referencia públicos por MILLÓN de tokens. Deben revisarse al
 * contratar; un modelo desconocido usa la tarifa más alta conocida (estimación
 * conservadora: nunca se subestima el costo).
 */
export type ModelPrice = { inputPerM: number; outputPerM: number };

export const MODEL_PRICES_USD: Record<string, ModelPrice> = {
  "gpt-4o-mini": { inputPerM: 0.15, outputPerM: 0.6 },
  "gpt-4o": { inputPerM: 2.5, outputPerM: 10 },
};

const FALLBACK: ModelPrice = Object.values(MODEL_PRICES_USD).reduce((a, b) =>
  a.outputPerM >= b.outputPerM ? a : b,
);

export function priceFor(model: string): ModelPrice {
  const exact = MODEL_PRICES_USD[model];
  if (exact) return exact;
  // Variantes con fecha, p. ej. "gpt-4o-mini-2024-07-18".
  const key = Object.keys(MODEL_PRICES_USD)
    .sort((a, b) => b.length - a.length)
    .find((k) => model.startsWith(k));
  return key ? MODEL_PRICES_USD[key]! : FALLBACK;
}

/** Costo estimado en micro-USD (1 USD = 1.000.000), redondeado hacia arriba. */
export function estimateCostMicros(
  model: string,
  tokensIn: number,
  tokensOut: number,
): number {
  const p = priceFor(model);
  // precio por millón de tokens × tokens / 1e6 USD × 1e6 micro = precio × tokens
  return Math.ceil(p.inputPerM * tokensIn + p.outputPerM * tokensOut);
}
