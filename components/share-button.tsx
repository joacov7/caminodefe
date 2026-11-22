"use client";

import { useState } from "react";
import { IconShare } from "./icons";

/**
 * Compartir con la hoja nativa del teléfono (WhatsApp, Instagram…) o, si no
 * está disponible, copiar al portapapeles. Sin rastreadores de terceros.
 */
export function ShareButton({
  title,
  text,
  path,
  className,
  label = "Compartir",
}: {
  title: string;
  text: string;
  path: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // cancelado por la persona: no hacemos nada
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin portapapeles */
    }
  }

  return (
    <button type="button" onClick={share} className={["inline-flex items-center gap-1.5 transition", className].join(" ")}>
      <IconShare className="h-4 w-4" />
      {copied ? "¡Copiado!" : label}
    </button>
  );
}
