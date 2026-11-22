/**
 * Planes para IGLESIAS (docs/13 §5.2) — fuente única, pura y testeable.
 * Los precios son hipótesis de referencia (sin cobro real todavía); los
 * límites SÍ se aplican en el servidor. Nunca se limita lo que afecta a las
 * personas que buscan ayuda (contacto pastoral, perfil público).
 */
export type ChurchPlanId = "free" | "basic" | "pro" | "advanced";

export type ChurchPlan = {
  id: ChurchPlanId;
  name: string;
  priceMinorMonthly: number | null; // null = a convenir
  audience: string;
  limits: { upcomingEvents: number; leaders: number; members: number };
  features: string[];
};

export const CHURCH_PLANS: Record<ChurchPlanId, ChurchPlan> = {
  free: {
    id: "free",
    name: "Gratuita",
    priceMinorMonthly: 0,
    audience: "Toda iglesia verificada",
    limits: { upcomingEvents: 10, leaders: 2, members: 150 },
    features: ["Perfil público y horarios", "Eventos (hasta 10 próximos)", "Bandeja de contacto pastoral", "Gestión de miembros"],
  },
  basic: {
    id: "basic",
    name: "Básica",
    priceMinorMonthly: 1_500_000,
    audience: "Hasta 150 miembros",
    limits: { upcomingEvents: 40, leaders: 5, members: 300 },
    features: ["Todo lo gratuito", "Más eventos y líderes", "Contenidos propios", "Estadísticas de participación"],
  },
  pro: {
    id: "pro",
    name: "Profesional",
    priceMinorMonthly: 4_000_000,
    audience: "Hasta 600 miembros",
    limits: { upcomingEvents: 200, leaders: 20, members: 1500 },
    features: ["Todo lo básico", "Grupos y comunicaciones", "Camino asignado a la congregación", "Soporte prioritario"],
  },
  advanced: {
    id: "advanced",
    name: "Avanzada",
    priceMinorMonthly: null,
    audience: "Redes de iglesias y denominaciones",
    limits: { upcomingEvents: 2000, leaders: 200, members: 50000 },
    features: ["Multi-sede", "Panel consolidado", "Acompañamiento dedicado"],
  },
};

export function getChurchPlan(id: string | null | undefined): ChurchPlan {
  return CHURCH_PLANS[(id as ChurchPlanId) ?? "free"] ?? CHURCH_PLANS.free;
}

export function isChurchPlanId(v: string): v is ChurchPlanId {
  return v in CHURCH_PLANS;
}

/** ¿Puede publicar otro evento próximo con su plan? */
export function canAddUpcomingEvent(planId: string | null | undefined, currentUpcoming: number): boolean {
  return currentUpcoming < getChurchPlan(planId).limits.upcomingEvents;
}
