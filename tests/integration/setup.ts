/**
 * Utilidades para pruebas de integración contra un PostgreSQL REAL.
 * Se activan solo si existe `TEST_DATABASE_URL` (CI y desarrollo local); en
 * otro caso las suites se omiten de forma explícita (no son "falsos verdes":
 * el resumen de Vitest las muestra como "skipped").
 *
 * IMPORTANTE: el rol de la URL debe ser dueño de las tablas pero NO
 * superusuario (los superusuarios ignoran la RLS), igual que en Neon.
 */
export const TEST_DB_URL = process.env.TEST_DATABASE_URL;
export const hasTestDb = Boolean(TEST_DB_URL);

if (TEST_DB_URL) {
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.DATABASE_DRIVER = "pg";
}

export function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
