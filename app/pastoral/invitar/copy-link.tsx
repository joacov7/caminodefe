"use client";

import { useState } from "react";

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={link} aria-label="Enlace de invitación" className="input font-mono text-xs" onFocus={(e) => e.target.select()} />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* sin portapapeles */
          }
        }}
        className="shrink-0 rounded-xl border border-border bg-surface px-4 text-sm font-medium hover:bg-muted"
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
