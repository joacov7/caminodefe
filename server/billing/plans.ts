/**
 * Catálogo de planes (fuente única de verdad). Puro y testeable.
 *
 * Etapa actual: modelo "donación primero" — el plan gratuito es generoso y el
 * Premium amplía límites, pero NO hay cobro real todavía. Los precios son de
 * referencia y configurables.
 */

export type PlanId = "free" | "premium";

export type Plan = {
  id: PlanId;
  name: string;
  /** Precio de referencia en unidad mínima (centavos). 0 = gratis. */
  priceMinor: number;
  currency: string;
  period: "monthly" | "yearly";
  aiMessagesPerDay: number;
  benefits: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Gratuito",
    priceMinor: 0,
    currency: "ARS",
    period: "monthly",
    aiMessagesPerDay: 15,
    benefits: [
      "Asistente bíblico con límites diarios",
      "Lectura de la Biblia (RVR1909)",
      "Devocionales seleccionados",
      "Mi Camino: notas, diario y favoritos",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    priceMinor: 200000, // ARS 2.000 de referencia (hipótesis, configurable)
    currency: "ARS",
    period: "monthly",
    aiMessagesPerDay: 200,
    benefits: [
      "Límites ampliados del asistente",
      "Estudios personalizados",
      "Planes de lectura avanzados",
      "Contenido premium autorizado",
    ],
  },
};

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}

export function planDailyLimit(id: string | null | undefined): number {
  return getPlan(id).aiMessagesPerDay;
}

/** Formatea un monto en unidad mínima a texto legible (p. ej. "$2.000"). */
export function formatAmount(minor: number, currency = "ARS"): string {
  const value = minor / 100;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
