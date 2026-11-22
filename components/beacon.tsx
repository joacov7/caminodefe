"use client";

import { useEffect } from "react";

/** Envía un contador anónimo una vez por vista (sin cookies ni identificadores). */
export function Beacon({ event }: { event: "bible_chapter_read" | "devotional_read" }) {
  useEffect(() => {
    try {
      const body = JSON.stringify({ event });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/metrica", new Blob([body], { type: "application/json" }));
      else void fetch("/api/metrica", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    } catch {
      /* nunca interrumpe la lectura */
    }
  }, [event]);
  return null;
}
