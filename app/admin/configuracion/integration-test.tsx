"use client";

import { useState, useTransition } from "react";
import { runIntegrationTest } from "@/server/admin/integration-actions";
import type { IntegrationId, TestResult } from "@/server/admin/integrations";
import { buttonClass } from "@/components/ui";

export function IntegrationTest({ id }: { id: IntegrationId }) {
  const [result, setResult] = useState<TestResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await runIntegrationTest(id)))}
        className={buttonClass("secondary", "px-4 py-2")}
      >
        {pending ? "Probando…" : "Probar conexión"}
      </button>
      {result && (
        <p role="status" className={`text-sm ${result.ok ? "text-primary" : "text-danger"}`}>
          {result.ok ? "✓ " : "✗ "}
          {result.message}
        </p>
      )}
    </div>
  );
}
