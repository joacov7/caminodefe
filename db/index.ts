/**
 * Cliente de base de datos (Drizzle sobre Neon serverless).
 *
 * La conexión es perezosa: no se crea hasta el primer uso, de modo que el build
 * y los módulos que no tocan la DB no requieran `DATABASE_URL`.
 */
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { requireEnv } from "@/lib/env";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  const client = neon(requireEnv("DATABASE_URL"));
  _db = drizzle(client, { schema });
  return _db;
}

export { schema };
