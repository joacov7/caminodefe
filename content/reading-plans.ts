/**
 * PLANES DE LECTURA — contenido curado (v1). Cada día tiene lectura(s),
 * un foco breve y una pregunta para reflexionar. Sin rachas punitivas: si
 * alguien se atrasa, simplemente continúa donde quedó.
 *
 * Referencias validadas contra el canon (tests/reading-plans.test.ts).
 */

export type Reading = { book: string; chapter: number; from?: number; to?: number };

export type PlanDay = { day: number; title: string; readings: Reading[]; question: string };

export type ReadingPlan = {
  id: string;
  title: string;
  subtitle: string;
  days: number;
  minutesPerDay: number;
  audience: string;
  tier: "free" | "premium";
  schedule: PlanDay[];
};

const juan = (n: number, title: string, question: string): PlanDay => ({
  day: n,
  title,
  readings: [{ book: "Juan", chapter: n }],
  question,
});

export const READING_PLANS: readonly ReadingPlan[] = [
  {
    id: "esperanza-7-dias",
    title: "Esperanza en 7 días",
    subtitle: "Siete pasajes para tiempos de cansancio o incertidumbre.",
    days: 7,
    minutesPerDay: 8,
    audience: "Para todos, especialmente si estás atravesando un momento difícil.",
    tier: "free",
    schedule: [
      { day: 1, title: "El Señor es mi pastor", readings: [{ book: "Salmos", chapter: 23 }], question: "¿En qué área de tu vida necesitás sentirte guiado/a hoy?" },
      { day: 2, title: "Fuerzas nuevas", readings: [{ book: "Isaías", chapter: 40, from: 25, to: 31 }], question: "¿Qué te quita las fuerzas en esta etapa?" },
      { day: 3, title: "No os congojéis", readings: [{ book: "Mateo", chapter: 6, from: 25, to: 34 }], question: "¿Qué preocupación podrías dejar en manos de Dios hoy?" },
      { day: 4, title: "No se turbe vuestro corazón", readings: [{ book: "Juan", chapter: 14, from: 1, to: 27 }], question: "¿Qué promesa de Jesús te da paz?" },
      { day: 5, title: "Nada nos separará", readings: [{ book: "Romanos", chapter: 8, from: 28, to: 39 }], question: "¿Te cuesta creer que nada te separa del amor de Dios?" },
      { day: 6, title: "La paz que guarda", readings: [{ book: "Filipenses", chapter: 4, from: 4, to: 13 }], question: "¿Por qué cosas podés dar gracias hoy?" },
      { day: 7, title: "Todo nuevo", readings: [{ book: "Apocalipsis", chapter: 21, from: 1, to: 7 }], question: "¿Cómo cambia tu presente la esperanza de lo que Dios promete?" },
    ],
  },
  {
    id: "oracion-7-dias",
    title: "Aprender a orar en 7 días",
    subtitle: "Oraciones de la Biblia que enseñan a hablar con Dios.",
    days: 7,
    minutesPerDay: 10,
    audience: "Para quienes quieren una vida de oración más sincera.",
    tier: "free",
    schedule: [
      { day: 1, title: "El modelo de Jesús", readings: [{ book: "Mateo", chapter: 6, from: 5, to: 15 }], question: "¿Qué línea del Padre nuestro te cuesta más orar?" },
      { day: 2, title: "Pedid, buscad, llamad", readings: [{ book: "Lucas", chapter: 11, from: 1, to: 13 }], question: "¿Qué te animás a pedirle a Dios con confianza?" },
      { day: 3, title: "Un corazón arrepentido", readings: [{ book: "Salmos", chapter: 51 }], question: "¿Qué necesitás confesar para empezar de nuevo?" },
      { day: 4, title: "Conocido por Dios", readings: [{ book: "Salmos", chapter: 139 }], question: "¿Qué sentís al saber que Dios te conoce por completo?" },
      { day: 5, title: "Orar por otros", readings: [{ book: "Efesios", chapter: 3, from: 14, to: 21 }], question: "¿Por quién podrías orar hoy?" },
      { day: 6, title: "La oración de Jesús", readings: [{ book: "Juan", chapter: 17 }], question: "¿Qué te enseña que Jesús haya orado por sus seguidores (y por vos)?" },
      { day: 7, title: "Orad sin cesar", readings: [{ book: "1 Tesalonicenses", chapter: 5, from: 16, to: 24 }], question: "¿Cómo podrías incorporar la oración a lo cotidiano?" },
    ],
  },
  {
    id: "fundamentos-30-dias",
    title: "Fundamentos en 30 días",
    subtitle: "El Evangelio de Juan, Filipenses y Santiago: conocer a Jesús y vivir la fe.",
    days: 30,
    minutesPerDay: 12,
    audience: "Ideal para quienes empiezan o quieren volver a lo esencial.",
    tier: "free",
    schedule: [
      juan(1, "El Verbo se hizo carne", "¿Qué dice este capítulo sobre quién es Jesús?"),
      juan(2, "La primera señal", "¿Qué revela Jesús al transformar el agua en vino?"),
      juan(3, "Nacer de nuevo", "¿Qué significa para vos «nacer otra vez»?"),
      juan(4, "El agua viva", "¿Qué «sed» de tu vida solo Jesús puede saciar?"),
      juan(5, "¿Quieres ser sano?", "¿Qué te gustaría que Jesús sane en vos?"),
      juan(6, "El pan de vida", "¿De qué te alimentás espiritualmente?"),
      juan(7, "Ríos de agua viva", "¿Por qué la gente tenía opiniones tan distintas sobre Jesús?"),
      juan(8, "La verdad os libertará", "¿De qué te gustaría ser libre?"),
      juan(9, "Ahora veo", "¿Qué empezaste a ver distinto desde que conocés a Jesús?"),
      juan(10, "El buen pastor", "¿Cómo te cuida Jesús como pastor?"),
      juan(11, "Yo soy la resurrección", "¿Qué te enseña que Jesús llorara con sus amigos?"),
      juan(12, "Si el grano no muere", "¿Qué te pide Jesús soltar para dar fruto?"),
      juan(13, "Lavar los pies", "¿A quién podrías servir con humildad esta semana?"),
      juan(14, "El camino, la verdad y la vida", "¿Qué promesa de este capítulo necesitás hoy?"),
      juan(15, "La vid verdadera", "¿Qué significa «permanecer» en Jesús en tu día a día?"),
      juan(16, "El Consolador", "¿Cómo te ayuda saber que Jesús venció al mundo?"),
      juan(17, "Jesús ora por nosotros", "¿Qué pide Jesús para sus seguidores?"),
      juan(18, "Arresto y negación", "¿Te identificás con Pedro? ¿En qué?"),
      juan(19, "Consumado es", "¿Qué significa para vos la cruz?"),
      juan(20, "¡Resucitó!", "¿Cómo cambia tu vida que Jesús esté vivo?"),
      juan(21, "¿Me amas?", "¿Qué te dice Jesús cuando fallaste?"),
      { day: 22, title: "Gozo en toda circunstancia", readings: [{ book: "Filipenses", chapter: 1 }], question: "¿Cómo puede haber gozo incluso en la dificultad?" },
      { day: 23, title: "El ejemplo de Cristo", readings: [{ book: "Filipenses", chapter: 2 }], question: "¿Qué actitud de Jesús querés imitar?" },
      { day: 24, title: "Prosigo al blanco", readings: [{ book: "Filipenses", chapter: 3 }], question: "¿Qué necesitás dejar atrás para seguir adelante?" },
      { day: 25, title: "La paz de Dios", readings: [{ book: "Filipenses", chapter: 4 }], question: "¿Qué cosas buenas podés pensar hoy (Filipenses 4:8)?" },
      { day: 26, title: "Fe en la prueba", readings: [{ book: "Santiago", chapter: 1 }], question: "¿Cómo podés ser «hacedor» de la Palabra hoy?" },
      { day: 27, title: "Fe que se ve", readings: [{ book: "Santiago", chapter: 2 }], question: "¿Cómo se ve tu fe en lo que hacés?" },
      { day: 28, title: "El poder de las palabras", readings: [{ book: "Santiago", chapter: 3 }], question: "¿Qué palabras querés cuidar esta semana?" },
      { day: 29, title: "Allegaos á Dios", readings: [{ book: "Santiago", chapter: 4 }], question: "¿Qué paso concreto te acerca a Dios hoy?" },
      { day: 30, title: "Rogad los unos por los otros", readings: [{ book: "Santiago", chapter: 5 }], question: "¿Con quién podés compartir lo que aprendiste en estos 30 días?" },
    ],
  },
];

export function getPlan(id: string): ReadingPlan | undefined {
  return READING_PLANS.find((p) => p.id === id);
}

export function formatReading(r: Reading): string {
  if (r.from == null) return `${r.book} ${r.chapter}`;
  return `${r.book} ${r.chapter}:${r.from}${r.to ? `-${r.to}` : ""}`;
}
