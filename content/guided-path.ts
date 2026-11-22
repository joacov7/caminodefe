/**
 * CAMINO GUIADO — contenido curado (v1). Revisable por el consejo doctrinal
 * mediante pull request. Las citas se verifican automáticamente contra el
 * canon y, si está disponible, contra el texto de la RVR1909
 * (tests/guided-path.test.ts). El texto bíblico NO se copia aquí: se lee de la
 * base (fuente única), para no inventar ni alterar palabras.
 *
 * Decisión del consejo (docs/11): "Conocer el Evangelio" va en la etapa 2 —
 * antes de los hábitos— porque es el fundamento de todo lo demás.
 *
 * Principios: lenguaje llano; distinguir texto bíblico de explicación; sin
 * puntajes ni "niveles espirituales"; cada etapa ofrece hablar con una persona.
 */

export type PassageRef = { book: string; chapter: number; from: number; to?: number };

export type GuidedStage = {
  id: string;
  number: number;
  title: string;
  /** Frase breve que invita a entrar. */
  tagline: string;
  /** Minutos aproximados (honesto, sin presión). */
  minutes: number;
  passages: PassageRef[];
  /** Explicación (interpretación evangélica común, en lenguaje llano). */
  explanation: string[];
  reflection: string[];
  /** Una acción concreta y alcanzable. */
  practice: string;
  /** Motivo sugerido al pedir acompañamiento a un pastor. */
  pastoralReason: string;
};

export const GUIDED_PATH: readonly GuidedStage[] = [
  {
    id: "conocer-a-jesus",
    number: 1,
    title: "Quiero conocer a Jesús",
    tagline: "Quién es Jesús y por qué su invitación sigue abierta hoy.",
    minutes: 10,
    passages: [
      { book: "Juan", chapter: 1, from: 14 },
      { book: "Mateo", chapter: 11, from: 28, to: 30 },
      { book: "Juan", chapter: 14, from: 6 },
    ],
    explanation: [
      "Los evangelios presentan a Jesús como Dios que se hizo hombre y vivió entre nosotros. No es solo un maestro moral: es alguien que se acerca personalmente.",
      "Su invitación es sencilla: «Venid a mí». No pide que primero tengas todo resuelto. Pide que vengas tal como estás.",
      "Jesús también afirma ser «el camino, la verdad y la vida». Es una afirmación fuerte; está bien tener preguntas y explorarlas con honestidad.",
    ],
    reflection: [
      "¿Qué imagen tenías de Jesús antes de leer estos pasajes?",
      "¿Qué te llama la atención de su invitación a los «trabajados y cargados»?",
      "¿Qué pregunta te gustaría hacerle a Dios hoy?",
    ],
    practice:
      "Leé Juan 1 completo con calma. Anotá una frase que te haya tocado y por qué.",
    pastoralReason: "Quiero conocer más sobre Jesús",
  },
  {
    id: "el-evangelio",
    number: 2,
    title: "Conocer el Evangelio",
    tagline: "La buena noticia: lo que Dios hizo por nosotros en Cristo.",
    minutes: 12,
    passages: [
      { book: "Romanos", chapter: 3, from: 23, to: 24 },
      { book: "Romanos", chapter: 6, from: 23 },
      { book: "1 Corintios", chapter: 15, from: 3, to: 4 },
      { book: "Efesios", chapter: 2, from: 8, to: 9 },
      { book: "Romanos", chapter: 10, from: 9, to: 10 },
    ],
    explanation: [
      "«Evangelio» significa buena noticia. La Biblia es honesta: todos fallamos y estamos lejos de Dios (eso es el pecado).",
      "La buena noticia es que Jesús murió por nuestros pecados y resucitó. El perdón y la vida nueva son un regalo (gracia), no un premio que se gana con esfuerzo.",
      "Ese regalo se recibe por la fe: confiar en Jesús y reconocerlo como Señor. Las iglesias evangélicas coinciden en este centro, aunque lo expresen de formas distintas.",
    ],
    reflection: [
      "¿Te cuesta aceptar algo como regalo, sin merecerlo? ¿Por qué?",
      "¿Qué significa para vos que Jesús haya resucitado?",
      "¿Estás listo/a para confiar en Jesús, o te gustaría seguir explorando? Ambas respuestas son honestas.",
    ],
    practice:
      "Si deseás recibir a Jesús, podés decírselo a Dios con tus palabras. Si querés, contáselo a un pastor o a un creyente de confianza: no tenés que transitarlo solo/a.",
    pastoralReason: "Quiero hablar sobre recibir a Jesús",
  },
  {
    id: "primeros-pasos",
    number: 3,
    title: "Primeros pasos en la fe",
    tagline: "Una vida nueva que empieza hoy y crece con el tiempo.",
    minutes: 10,
    passages: [
      { book: "2 Corintios", chapter: 5, from: 17 },
      { book: "Juan", chapter: 1, from: 12 },
      { book: "Filipenses", chapter: 1, from: 6 },
      { book: "1 Juan", chapter: 1, from: 9 },
    ],
    explanation: [
      "La fe en Cristo no es un trámite: es el comienzo de una relación. La Biblia habla de «nueva criatura»: algo cambia por dentro, aunque el proceso sea gradual.",
      "Vas a fallar, y eso no anula tu fe. Dios promete perdonar cuando confesamos, y completar la obra que empezó en nosotros.",
      "Crecer lleva tiempo. Nadie madura en una semana; lo importante es seguir caminando.",
    ],
    reflection: [
      "¿Qué te gustaría que Dios cambie en vos?",
      "¿Qué te preocupa de empezar este camino?",
    ],
    practice: "Elegí un momento fijo del día (5 minutos) para leer y orar esta semana.",
    pastoralReason: "Estoy dando mis primeros pasos en la fe",
  },
  {
    id: "aprender-a-orar",
    number: 4,
    title: "Aprender a orar",
    tagline: "Hablar con Dios con sinceridad, sin fórmulas.",
    minutes: 10,
    passages: [
      { book: "Mateo", chapter: 6, from: 6, to: 13 },
      { book: "Filipenses", chapter: 4, from: 6, to: 7 },
    ],
    explanation: [
      "Orar es conversar con Dios. Jesús enseñó a hacerlo con sencillez, en lo secreto, sin repetir palabras vacías.",
      "El «Padre nuestro» es un modelo: adorar a Dios, desear su voluntad, pedir lo necesario, pedir y dar perdón, y pedir ayuda frente al mal.",
      "Podés llevarle a Dios tus preocupaciones concretas. La promesa no es que todo salga como queremos, sino una paz que guarda el corazón.",
    ],
    reflection: [
      "¿Qué te gustaría decirle a Dios hoy, con tus propias palabras?",
      "¿Qué preocupación podrías entregarle en oración?",
    ],
    practice:
      "Orá 5 minutos siguiendo el Padre nuestro como guía: una línea, y luego tus palabras.",
    pastoralReason: "Necesito oración",
  },
  {
    id: "comprender-la-biblia",
    number: 5,
    title: "Comprender la Biblia",
    tagline: "Cómo leerla, por dónde empezar y cómo aplicarla.",
    minutes: 12,
    passages: [
      { book: "2 Timoteo", chapter: 3, from: 16, to: 17 },
      { book: "Salmos", chapter: 119, from: 105 },
      { book: "Lucas", chapter: 24, from: 27 },
      { book: "Santiago", chapter: 1, from: 22 },
    ],
    explanation: [
      "La Biblia es una biblioteca de 66 libros escritos a lo largo de siglos, con un hilo central: Dios rescatando a su pueblo, que culmina en Jesús.",
      "Para entender un pasaje, ayuda preguntar: ¿qué dice?, ¿qué significó para sus primeros lectores?, ¿qué enseña sobre Dios?, ¿cómo lo vivo hoy?",
      "Un buen comienzo es un evangelio (Marcos o Juan). El asistente y tu iglesia pueden ayudarte con pasajes difíciles; no tenés que entender todo de una vez.",
    ],
    reflection: [
      "¿Qué te resulta más difícil al leer la Biblia?",
      "¿Qué pasaje leído hasta ahora te gustaría poner en práctica?",
    ],
    practice:
      "Empezá el plan «Fundamentos en 30 días» o leé Marcos 1 con las cuatro preguntas.",
    pastoralReason: "Quiero aprender a leer la Biblia",
  },
  {
    id: "habitos-espirituales",
    number: 6,
    title: "Construir hábitos espirituales",
    tagline: "Pequeñas prácticas, sostenidas, que dan fruto.",
    minutes: 10,
    passages: [
      { book: "Salmos", chapter: 1, from: 1, to: 3 },
      { book: "Marcos", chapter: 1, from: 35 },
      { book: "Daniel", chapter: 6, from: 10 },
    ],
    explanation: [
      "Jesús buscaba momentos a solas para orar. Daniel tenía un ritmo diario. Los hábitos no ganan el amor de Dios: nos disponen a recibirlo.",
      "El Salmo 1 usa la imagen de un árbol junto al agua: crece despacio, pero con raíces firmes.",
      "Mejor 10 minutos constantes que una hora una vez. Y si un día no pudiste, simplemente volvé: no hay nada que recuperar ni que compensar.",
    ],
    reflection: [
      "¿Qué momento del día es más realista para vos?",
      "¿Qué te distrae o te aleja de ese tiempo?",
    ],
    practice:
      "Configurá un recordatorio diario (en tu perfil) a la hora que elijas, y agregalo a tu calendario.",
    pastoralReason: "Quiero ayuda para sostener mi vida espiritual",
  },
  {
    id: "principios-cristianos",
    number: 7,
    title: "Aprender principios cristianos",
    tagline: "Amar a Dios y al prójimo en la vida diaria.",
    minutes: 12,
    passages: [
      { book: "Mateo", chapter: 22, from: 37, to: 39 },
      { book: "Miqueas", chapter: 6, from: 8 },
      { book: "Gálatas", chapter: 5, from: 22, to: 23 },
      { book: "Colosenses", chapter: 3, from: 12, to: 14 },
    ],
    explanation: [
      "Jesús resumió la ley en dos mandamientos: amar a Dios con todo lo que somos, y al prójimo como a nosotros mismos.",
      "La vida cristiana no es una lista de prohibiciones: es un carácter que el Espíritu de Dios forma (amor, gozo, paz, paciencia…).",
      "Sobre algunas cuestiones prácticas las iglesias tienen convicciones distintas; ante dudas concretas, conversalo con tu pastor.",
    ],
    reflection: [
      "¿En qué relación concreta te desafía hoy amar al prójimo?",
      "¿Qué fruto del Espíritu te gustaría ver crecer en vos?",
    ],
    practice: "Hacé esta semana un acto concreto de bondad, sin que nadie lo sepa.",
    pastoralReason: "Tengo preguntas sobre cómo vivir mi fe",
  },
  {
    id: "encontrar-una-iglesia",
    number: 8,
    title: "Encontrar una iglesia",
    tagline: "La fe se vive en comunidad, no en soledad.",
    minutes: 8,
    passages: [
      { book: "Hechos", chapter: 2, from: 42, to: 47 },
      { book: "Hebreos", chapter: 10, from: 24, to: 25 },
    ],
    explanation: [
      "Desde el principio, los creyentes se reunían: aprendían juntos, oraban, compartían la mesa y se ayudaban.",
      "Una iglesia sana enseña la Biblia, centra todo en Jesús, te recibe con respeto y no te presiona. Está bien visitar más de una.",
      "La app puede acompañarte, pero no reemplaza a una comunidad real con nombres y rostros.",
    ],
    reflection: [
      "¿Qué te da temor o vergüenza de ir a una iglesia?",
      "¿Qué buscarías en una comunidad?",
    ],
    practice:
      "Buscá una iglesia cerca, mirá sus horarios y, si querés, avisale al pastor que te gustaría visitarla.",
    pastoralReason: "Quiero visitar la iglesia",
  },
  {
    id: "integrarme-a-una-comunidad",
    number: 9,
    title: "Integrarme a una comunidad",
    tagline: "Pasar de visitante a ser parte.",
    minutes: 10,
    passages: [
      { book: "Romanos", chapter: 12, from: 4, to: 5 },
      { book: "Gálatas", chapter: 6, from: 2 },
      { book: "1 Pedro", chapter: 4, from: 10 },
    ],
    explanation: [
      "La Biblia compara a la iglesia con un cuerpo: cada parte es distinta y necesaria. Vos también tenés algo para aportar.",
      "Ser parte es dejarse conocer: un grupo pequeño, un servicio, una amistad. Es ahí donde la fe se vuelve vida compartida.",
      "Llevar las cargas unos de otros incluye pedir ayuda cuando la necesitás.",
    ],
    reflection: [
      "¿Qué dones, talentos o experiencias podrías poner al servicio de otros?",
      "¿Con quién podrías empezar una amistad en tu iglesia?",
    ],
    practice: "Preguntá en tu iglesia por un grupo pequeño o un área donde puedas servir.",
    pastoralReason: "Quiero ser parte de un grupo",
  },
  {
    id: "seguir-creciendo",
    number: 10,
    title: "Continuar creciendo",
    tagline: "Un camino para toda la vida.",
    minutes: 8,
    passages: [
      { book: "2 Pedro", chapter: 3, from: 18 },
      { book: "Filipenses", chapter: 3, from: 12, to: 14 },
      { book: "Colosenses", chapter: 2, from: 6, to: 7 },
    ],
    explanation: [
      "Terminar estas etapas no es llegar a una meta espiritual: es haber echado raíces para seguir creciendo.",
      "Pablo, con años de fe, decía «prosigo»: nadie deja de aprender. Crecer en gracia y conocimiento es un proceso humilde y continuo.",
      "Podés seguir con planes de lectura, estudios de tu iglesia y, con el tiempo, acompañar a alguien que recién empieza.",
    ],
    reflection: [
      "¿Qué cambió en vos desde que empezaste este camino?",
      "¿A quién podrías acompañar en sus primeros pasos?",
    ],
    practice: "Elegí tu próximo plan de lectura y compartí este camino con alguien.",
    pastoralReason: "Quiero seguir creciendo con acompañamiento",
  },
];

export function getStage(id: string): GuidedStage | undefined {
  return GUIDED_PATH.find((s) => s.id === id);
}

export function formatPassage(p: PassageRef): string {
  return `${p.book} ${p.chapter}:${p.from}${p.to ? `-${p.to}` : ""}`;
}
