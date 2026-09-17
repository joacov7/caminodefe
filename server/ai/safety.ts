/**
 * Guardarraíles de seguridad del asistente. Funciones puras y testeables.
 *
 * Principios (ver docs/00 y CLAUDE.md):
 * - Ante señales de crisis (autolesión, abuso, violencia): responder con empatía,
 *   priorizar la seguridad, derivar a ayuda humana y recursos; NO diagnosticar.
 * - El asistente no reclama autoridad espiritual ni revelaciones.
 */

export type SafetyFlag = "crisis" | "identity_challenge" | "none";

/**
 * Recursos de emergencia. Estos valores deben ser CONFIRMADOS y ampliados por
 * país (ver docs/07, pregunta abierta 4). Se centralizan acá para poder
 * mantenerlos sin tocar la lógica.
 */
export type EmergencyResource = { label: string; contact: string; country: string };

export const EMERGENCY_RESOURCES: EmergencyResource[] = [
  { label: "Emergencias (Argentina)", contact: "911", country: "AR" },
  {
    label: "Centro de Asistencia al Suicida (Argentina)",
    contact: "135 (línea gratuita) / (011) 5275-1135",
    country: "AR",
  },
];

// Señales léxicas de crisis. Heurística conservadora en español: ante la duda,
// mejor ofrecer ayuda humana de más que de menos.
const CRISIS_PATTERNS: RegExp[] = [
  /\b(me\s+)?(quiero|quisiera|deseo)\s+morir(me)?\b/i,
  /\bno\s+quiero\s+(seguir\s+)?vivir\b/i,
  /\b(me\s+)?(quiero|quisiera)\s+matar(me)?\b/i,
  /\bsuicid/i,
  /\bhacerme\s+da[ñn]o\b/i,
  /\blastimarme\b/i,
  /\bautolesi/i,
  /\bme\s+est[áa]n?\s+(pegando|golpeando|abusando)\b/i,
  /\babus(o|aron|an)\s+de\s+m[íi]\b/i,
  /\bviolencia\s+(de\s+g[ée]nero|dom[ée]stica)\b/i,
];

const IDENTITY_PATTERNS: RegExp[] = [
  /\b(sos|eres|tu\s+eres)\s+(dios|jes[úu]s|el\s+esp[íi]ritu\s+santo)\b/i,
  /\b(sos|eres)\s+(un\s+)?(profeta|pastor|[áa]ngel)\b/i,
  /\bhabl[áa]s\s+por\s+dios\b/i,
];

export function detectSafetyFlag(text: string): SafetyFlag {
  if (CRISIS_PATTERNS.some((re) => re.test(text))) return "crisis";
  if (IDENTITY_PATTERNS.some((re) => re.test(text))) return "identity_challenge";
  return "none";
}

/** Respuesta empática de crisis, con recursos. No usa el modelo de IA. */
export function buildCrisisResponse(country = "AR"): string {
  const resources = EMERGENCY_RESOURCES.filter((r) => r.country === country);
  const lines = resources.map((r) => `- ${r.label}: ${r.contact}`).join("\n");
  return [
    "Lamento mucho que estés pasando por un momento tan difícil. Tu vida y tu " +
      "seguridad importan.",
    "",
    "No estás solo/a. Por favor, buscá ayuda de una persona de confianza y, si " +
      "estás en peligro o pensás en hacerte daño, contactá ahora mismo a un " +
      "servicio de ayuda:",
    lines,
    "",
    "Si querés, también puedo ayudarte a encontrar una iglesia cercana o " +
      "acompañarte a preparar cómo pedir ayuda. No estoy capacitado para " +
      "reemplazar a un profesional ni a alguien que pueda estar con vos en " +
      "persona.",
  ].join("\n");
}
