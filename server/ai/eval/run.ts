/**
 * Runner de la batería de evaluación. Usa el proveedor REAL (requiere
 * OPENAI_API_KEY y DATABASE_URL) y consulta la DB para verificar citas.
 *
 * Uso: `npx tsx server/ai/eval/run.ts`
 * No corre en CI (necesita credenciales y llamadas al modelo).
 */
import { getLLMProvider } from "../provider";
import { runAssistant } from "../assistant";
import { retrieveByReference, dbFetchVerse } from "../rag";
import { EVAL_CASES } from "./cases";
import { scoreCase } from "./score";

async function main() {
  const provider = await getLLMProvider();
  const fetchVerse = dbFetchVerse();

  let passed = 0;
  for (const c of EVAL_CASES) {
    const result = await runAssistant([{ role: "user", content: c.prompt }], {
      provider,
      retrieve: (q) => retrieveByReference(q, fetchVerse),
      verseExists: (book, chapter, verse) =>
        fetchVerse(book.name, chapter, verse).then((t) => t !== null),
      country: "AR",
    });
    const scored = scoreCase(c, result);
    if (scored.passed) passed++;
    const mark = scored.passed ? "✓" : "✗";
    console.log(`${mark} ${c.id}`);
    for (const check of scored.checks) {
      if (!check.pass) console.log(`    · falló: ${check.name}`);
    }
  }
  console.log(`\n${passed}/${EVAL_CASES.length} casos aprobados.`);
  if (passed < EVAL_CASES.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Error en la evaluación:", err);
  process.exit(1);
});
