/**
 * Semillas mínimas para desarrollo:
 * - Versión bíblica RVR1909 (dominio público) + unos versículos de muestra.
 * - Planes free / premium con límites configurables.
 *
 * La importación completa de la Biblia RVR1909 se hará como tarea de datos
 * aparte (Paso 2). Uso: `npm run db:seed` (requiere DATABASE_URL).
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { requireEnv } from "../lib/env";
import { bibleVersions, bibleVerses, plans } from "./schema";

async function main() {
  const db = drizzle(neon(requireEnv("DATABASE_URL")), {
    schema: { bibleVersions, bibleVerses, plans },
  });

  await db
    .insert(bibleVersions)
    .values({
      id: "rvr1909",
      name: "Reina-Valera 1909",
      language: "es",
      license: "Dominio público",
      isPublicDomain: true,
    })
    .onConflictDoNothing();

  await db
    .insert(bibleVerses)
    .values([
      {
        versionId: "rvr1909",
        book: "Juan",
        chapter: 3,
        verse: 16,
        text:
          "Porque de tal manera amó Dios al mundo, que ha dado á su Hijo " +
          "unigénito, para que todo aquel que en él cree, no se pierda, mas " +
          "tenga vida eterna.",
      },
      {
        versionId: "rvr1909",
        book: "Salmos",
        chapter: 23,
        verse: 1,
        text: "Jehová es mi pastor; nada me faltará.",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(plans)
    .values([
      {
        id: "free",
        name: "Gratuito",
        price: 0,
        currency: "ARS",
        period: "monthly",
        limits: { aiMessagesPerDay: 15 },
        benefits: ["Asistente con límites", "Lecturas", "Devocionales"],
        active: true,
      },
      {
        id: "premium",
        name: "Premium",
        price: 2000,
        currency: "ARS",
        period: "monthly",
        limits: { aiMessagesPerDay: 200 },
        benefits: [
          "Límites ampliados de IA",
          "Estudios personalizados",
          "Planes avanzados",
        ],
        active: true,
      },
    ])
    .onConflictDoNothing();

  console.log("Semillas cargadas correctamente.");
}

main().catch((err) => {
  console.error("Error al cargar semillas:", err);
  process.exit(1);
});
