/**
 * Cliente de base de datos (Drizzle).
 *
 * - Producción: Neon serverless por HTTP (`drizzle-orm/neon-http`).
 * - Desarrollo/CI: si `DATABASE_DRIVER=pg`, se usa node-postgres contra un
 *   PostgreSQL local (permite pruebas de integración y E2E reales). El paquete
 *   `pg` es dependencia de desarrollo y se carga de forma diferida, por lo que
 *   nunca entra en el bundle de producción.
 *
 * La conexión es perezosa: no se crea hasta el primer uso, de modo que el build
 * y los módulos que no tocan la DB no requieran `DATABASE_URL`.
 *
 * Datos PRIVADOS (conversaciones, notas, diario, favoritos, progreso): se leen y
 * escriben SIEMPRE con `withUserContext`, que fija `app.user_id` dentro de la
 * misma transacción. Esas tablas tienen `FORCE ROW LEVEL SECURITY` (migración
 * 0008): sin el contexto correcto, la base no devuelve ni acepta filas, aunque
 * el código tuviera un bug.
 */
import { createRequire } from "node:module";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import type { BatchItem, BatchResponse } from "drizzle-orm/batch";
import { requireEnv } from "@/lib/env";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

let _db: Db | null = null;
let _driver: "neon" | "pg" = "neon";

export function getDb(): Db {
  if (_db) return _db;
  const url = requireEnv("DATABASE_URL");
  if (process.env.DATABASE_DRIVER === "pg") {
    // Carga diferida: `pg` solo existe en desarrollo/CI.
    const req = createRequire(import.meta.url);
    const { drizzle: drizzlePg } = req(
      "drizzle-orm/node-postgres",
    ) as typeof import("drizzle-orm/node-postgres");
    const { Pool } = req("pg") as typeof import("pg");
    const pool = new Pool({ connectionString: url, max: 5 });
    // La API de consultas es la misma (PgDatabase); solo difiere `batch`,
    // que se abstrae en `withUserContext`.
    _db = drizzlePg(pool, { schema }) as unknown as Db;
    _driver = "pg";
  } else {
    _db = drizzle(neon(url), { schema });
    _driver = "neon";
  }
  return _db;
}

/** Devuelve la DB o `null` si no está configurada (para estados vacíos claros). */
export function dbOrNull(): Db | null {
  try {
    return getDb();
  } catch {
    return null;
  }
}

/** Variables de sesión permitidas (lista cerrada: nada viene del cliente). */
type ContextSetting = "app.user_id" | "app.maintenance";

function setContext(db: Db, settings: Partial<Record<ContextSetting, string>>) {
  const entries = Object.entries(settings) as [ContextSetting, string][];
  // `is_local = true`: el valor vive solo dentro de esta transacción.
  const parts = entries.map(([k, v]) => sql`set_config(${k}, ${v}, true)`);
  return db.execute(sql`select ${sql.join(parts, sql`, `)}`);
}

async function withContext<U extends BatchItem<"pg">, T extends Readonly<[U, ...U[]]>>(
  settings: Partial<Record<ContextSetting, string>>,
  build: (db: Db) => T,
): Promise<BatchResponse<T>> {
  const db = getDb();
  if (_driver === "pg") {
    const pgDb = db as unknown as {
      transaction<R>(fn: (tx: Db) => Promise<R>): Promise<R>;
    };
    return pgDb.transaction(async (tx) => {
      await setContext(tx, settings);
      const out: unknown[] = [];
      for (const q of build(tx)) out.push(await q);
      return out as BatchResponse<T>;
    });
  }
  const [, ...rest] = await db.batch([setContext(db, settings), ...build(db)] as unknown as Readonly<[U, ...U[]]>);
  return rest as unknown as BatchResponse<T>;
}

/**
 * Ejecuta consultas sobre datos privados con el contexto RLS del usuario, en
 * UNA transacción. `build` recibe la conexión a usar y devuelve las consultas
 * (aún no ejecutadas). Devuelve los resultados en el mismo orden.
 *
 * En Neon HTTP se usa `batch` (transaccional); en `pg`, una transacción
 * interactiva.
 */
export async function withUserContext<
  U extends BatchItem<"pg">,
  T extends Readonly<[U, ...U[]]>,
>(userId: string, build: (db: Db) => T): Promise<BatchResponse<T>> {
  if (!userId) throw new Error("withUserContext requiere un userId.");
  return withContext({ "app.user_id": userId }, build);
}

/**
 * Tareas de mantenimiento (retención de datos). Solo habilita las políticas
 * RLS de mantenimiento (p. ej. `conversations_purge`), que permiten borrar
 * ÚNICAMENTE datos ya vencidos. Nunca usar desde acciones de usuario.
 */
export async function withMaintenanceContext<
  U extends BatchItem<"pg">,
  T extends Readonly<[U, ...U[]]>,
>(build: (db: Db) => T): Promise<BatchResponse<T>> {
  return withContext({ "app.maintenance": "purge" }, build);
}

export { schema };
