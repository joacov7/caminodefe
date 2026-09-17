import { z } from "zod";

/**
 * Validación centralizada de variables de entorno.
 *
 * - Las variables son OPCIONALES a nivel de tipo para que el build no falle
 *   cuando aún no hay secretos configurados (p. ej. en previews o CI).
 * - Usá los helpers `requireEnv(...)` en el punto donde el valor es realmente
 *   necesario (conexión a DB, cliente de OpenAI, etc.) para fallar con un
 *   mensaje claro en tiempo de ejecución.
 * - Nunca se imprime el valor de un secreto.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Base de datos (Neon / Postgres)
  DATABASE_URL: z.string().url().optional(),

  // Auth.js (NextAuth v5)
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  // Proveedor de IA (OpenAI) — se usa en el servicio de IA (Paso 3)
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
});

export type Env = z.infer<typeof schema>;

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Solo se listan los NOMBRES de las variables inválidas, nunca sus valores.
  const invalid = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Variables de entorno inválidas: ${invalid}`);
}

export const env: Env = parsed.data;

/** Devuelve el valor de una variable requerida o lanza un error claro. */
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `Falta la variable de entorno requerida "${String(key)}". ` +
        `Configurala como secreto de entorno (nunca en el repositorio).`,
    );
  }
  return value as NonNullable<Env[K]>;
}
