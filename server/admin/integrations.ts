/**
 * Estado y verificación de las integraciones externas (pantalla
 * Administración → Configuración).
 *
 * Principio: las CLAVES viven solo en variables de entorno (Vercel, cifradas).
 * Esta capa informa si están cargadas y si funcionan, pero NUNCA devuelve ni
 * guarda un valor secreto. Las pruebas usan endpoints de solo lectura y sin
 * costo de los proveedores.
 */
export type IntegrationId =
  | "database"
  | "auth"
  | "site"
  | "google"
  | "email"
  | "openai"
  | "cron"
  | "mercadopago";

export type IntegrationInfo = {
  id: IntegrationId;
  name: string;
  purpose: string;
  required: boolean;
  /** Nombres EXACTOS de las variables a cargar en Vercel. */
  variables: string[];
  howTo: string[];
  link?: { label: string; href: string };
  testable: boolean;
};

export const INTEGRATIONS: IntegrationInfo[] = [
  {
    id: "database",
    name: "Base de datos (Neon)",
    purpose: "Guarda cuentas, iglesias, progreso y todo lo que persiste.",
    required: true,
    variables: ["DATABASE_URL"],
    howTo: [
      "Creá un proyecto en Neon (región São Paulo).",
      "Copiá la «Connection string» (incluye ?sslmode=require).",
      "Después de cargarla: ejecutá las migraciones y la carga de la Biblia (docs/14).",
    ],
    link: { label: "Abrir Neon", href: "https://console.neon.tech" },
    testable: true,
  },
  {
    id: "auth",
    name: "Sesiones",
    purpose: "Firma las sesiones de las personas que ingresan.",
    required: true,
    variables: ["AUTH_SECRET"],
    howTo: ["Generala con: openssl rand -base64 32", "No la compartas ni la cambies sin motivo (cierra todas las sesiones)."],
    testable: false,
  },
  {
    id: "site",
    name: "Dirección pública",
    purpose: "Enlaces compartibles, QR de invitación, buscadores y avisos de pago.",
    required: true,
    variables: ["NEXT_PUBLIC_SITE_URL", "AUTH_URL"],
    howTo: ["Ambas con tu dominio, por ejemplo https://caminodefe.app (sin barra final)."],
    testable: false,
  },
  {
    id: "google",
    name: "Ingreso con Google",
    purpose: "Permite entrar con la cuenta de Google.",
    required: false,
    variables: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    howTo: [
      "Google Cloud → Credenciales → Crear ID de cliente OAuth (aplicación web).",
      "URI de redirección autorizada: <tu dominio>/api/auth/callback/google",
      "Se verifica ingresando con una cuenta de Google en /ingresar.",
    ],
    link: { label: "Abrir Google Cloud", href: "https://console.cloud.google.com/apis/credentials" },
    testable: false,
  },
  {
    id: "email",
    name: "Ingreso por correo (enlace mágico)",
    purpose: "Envía el enlace para entrar sin contraseña.",
    required: false,
    variables: ["AUTH_RESEND_KEY", "EMAIL_FROM"],
    howTo: [
      "En Resend: verificá tu dominio y creá una API key.",
      "EMAIL_FROM con ese dominio, por ejemplo: Camino de Fe <hola@tu-dominio.com>",
    ],
    link: { label: "Abrir Resend", href: "https://resend.com/api-keys" },
    testable: true,
  },
  {
    id: "openai",
    name: "Asistente bíblico (OpenAI)",
    purpose: "Responde preguntas con citas verificadas.",
    required: false,
    variables: ["OPENAI_API_KEY"],
    howTo: [
      "En OpenAI creá una API key.",
      "Antes, fijá un límite de gasto mensual (Billing → Limits).",
      "Opcional: OPENAI_MODEL (por defecto gpt-4o-mini).",
    ],
    link: { label: "Abrir OpenAI", href: "https://platform.openai.com/api-keys" },
    testable: true,
  },
  {
    id: "cron",
    name: "Mantenimiento diario",
    purpose: "Borra datos vencidos (conversaciones eliminadas hace más de 30 días, sesiones viejas).",
    required: true,
    variables: ["CRON_SECRET"],
    howTo: ["Generala con: openssl rand -hex 32", "Vercel la usa automáticamente para la tarea programada."],
    testable: false,
  },
  {
    id: "mercadopago",
    name: "Cobro de aportes (Mercado Pago)",
    purpose: "Cobra los aportes voluntarios a la plataforma. Sin esto, se registran como pendientes.",
    required: false,
    variables: ["MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_WEBHOOK_SECRET"],
    howTo: [
      "Empezá con credenciales de PRUEBA (TEST-…) y probá un pago.",
      "En Mercado Pago → Webhooks: URL <tu dominio>/api/pagos/mercadopago, evento «Pagos»; copiá la clave secreta.",
      "Recién después, credenciales de producción.",
    ],
    link: { label: "Abrir Mercado Pago Developers", href: "https://www.mercadopago.com.ar/developers/panel/app" },
    testable: true,
  },
];

export type IntegrationStatus = {
  id: IntegrationId;
  /** Variables presentes / faltantes (solo NOMBRES). */
  present: string[];
  missing: string[];
  state: "ok" | "partial" | "missing";
  notes: string[];
};

type Env = Record<string, string | undefined>;

const has = (env: Env, k: string) => Boolean(env[k] && env[k]!.trim() !== "");

/** Estado de configuración (PURO): nunca incluye valores. */
export function integrationStatus(env: Env): IntegrationStatus[] {
  return INTEGRATIONS.map((i) => {
    const present = i.variables.filter((v) => has(env, v));
    // El secreto del webhook es recomendable pero no impide funcionar.
    const essential = i.id === "mercadopago" ? ["MERCADOPAGO_ACCESS_TOKEN"] : i.variables;
    const missing = i.variables.filter((v) => !has(env, v));
    const essentialMissing = essential.filter((v) => !has(env, v));
    const notes: string[] = [];
    if (i.id === "site") {
      for (const v of ["NEXT_PUBLIC_SITE_URL", "AUTH_URL"]) {
        const val = env[v];
        if (val && !/^https:\/\//.test(val) && !/localhost|127\.0\.0\.1/.test(val)) notes.push(`${v} debería empezar con https://`);
        if (val?.endsWith("/")) notes.push(`${v} no debe terminar en «/»`);
      }
    }
    if (i.id === "auth" && env.AUTH_SECRET && env.AUTH_SECRET.length < 32) notes.push("AUTH_SECRET es corta: usá al menos 32 caracteres.");
    if (i.id === "cron" && env.CRON_SECRET && env.CRON_SECRET.length < 16) notes.push("CRON_SECRET es corta: usá al menos 16 caracteres.");
    if (i.id === "mercadopago" && has(env, "MERCADOPAGO_ACCESS_TOKEN")) {
      notes.push(env.MERCADOPAGO_ACCESS_TOKEN!.startsWith("TEST-") ? "Modo PRUEBA (sandbox)." : "Modo PRODUCCIÓN: cobra dinero real.");
      if (!has(env, "MERCADOPAGO_WEBHOOK_SECRET")) notes.push("Falta MERCADOPAGO_WEBHOOK_SECRET: los avisos de pago no se verifican con firma.");
    }
    if (i.id === "database" && env.DATABASE_DRIVER === "pg") notes.push("Modo desarrollo (DATABASE_DRIVER=pg): no usar en producción.");
    const state: IntegrationStatus["state"] =
      essentialMissing.length === 0 ? (missing.length === 0 ? "ok" : "partial") : present.length > 0 ? "partial" : "missing";
    return { id: i.id, present, missing, state, notes };
  });
}

/** Ingreso habilitado si hay al menos un método. */
export function canSignIn(env: Env): boolean {
  return (has(env, "GOOGLE_CLIENT_ID") && has(env, "GOOGLE_CLIENT_SECRET")) || (has(env, "AUTH_RESEND_KEY") && has(env, "EMAIL_FROM"));
}

export type TestResult = { ok: boolean; message: string };

type Fetch = typeof fetch;

/** Pruebas de conexión con endpoints de SOLO LECTURA y sin costo. */
export async function testOpenAI(env: Env, f: Fetch = fetch): Promise<TestResult> {
  if (!has(env, "OPENAI_API_KEY")) return { ok: false, message: "Falta OPENAI_API_KEY." };
  const model = env.OPENAI_MODEL || "gpt-4o-mini";
  const r = await f(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
  });
  if (r.status === 401) return { ok: false, message: "La clave fue rechazada (inválida o revocada)." };
  if (r.status === 404) return { ok: false, message: `La clave funciona pero no tiene acceso al modelo «${model}».` };
  if (r.status === 429) return { ok: false, message: "OpenAI respondió «límite o saldo agotado». Revisá Billing." };
  if (!r.ok) return { ok: false, message: `OpenAI respondió ${r.status}.` };
  return { ok: true, message: `Conectado. Modelo «${model}» disponible.` };
}

export async function testResend(env: Env, f: Fetch = fetch): Promise<TestResult> {
  if (!has(env, "AUTH_RESEND_KEY")) return { ok: false, message: "Falta AUTH_RESEND_KEY." };
  const r = await f("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${env.AUTH_RESEND_KEY}` } });
  if (r.status === 401 || r.status === 403) return { ok: false, message: "La clave fue rechazada o no tiene permiso para leer dominios." };
  if (!r.ok) return { ok: false, message: `Resend respondió ${r.status}.` };
  const data = (await r.json()) as { data?: { name: string; status: string }[] };
  const fromDomain = /@([^>\s]+)/.exec(env.EMAIL_FROM ?? "")?.[1]?.toLowerCase();
  if (!fromDomain) return { ok: false, message: "Falta EMAIL_FROM o no tiene una dirección válida." };
  const d = data.data?.find((x) => x.name.toLowerCase() === fromDomain);
  if (!d) return { ok: false, message: `El dominio «${fromDomain}» de EMAIL_FROM no está agregado en Resend.` };
  if (d.status !== "verified") return { ok: false, message: `El dominio «${fromDomain}» todavía no está verificado (estado: ${d.status}).` };
  return { ok: true, message: `Conectado. Dominio «${fromDomain}» verificado.` };
}

export async function testMercadoPago(env: Env, f: Fetch = fetch): Promise<TestResult> {
  if (!has(env, "MERCADOPAGO_ACCESS_TOKEN")) return { ok: false, message: "Falta MERCADOPAGO_ACCESS_TOKEN." };
  const r = await f("https://api.mercadopago.com/users/me", {
    headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` },
  });
  if (r.status === 401) return { ok: false, message: "El token fue rechazado." };
  if (!r.ok) return { ok: false, message: `Mercado Pago respondió ${r.status}.` };
  const me = (await r.json()) as { site_id?: string };
  const mode = env.MERCADOPAGO_ACCESS_TOKEN!.startsWith("TEST-") ? "prueba" : "PRODUCCIÓN";
  return { ok: true, message: `Conectado en modo ${mode}${me.site_id ? ` (país ${me.site_id})` : ""}.` };
}
