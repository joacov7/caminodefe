"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "cdf:last-read";

/** Guarda en ESTE dispositivo el último capítulo leído (comodidad local). */
export function RememberReading({ href, label }: { href: string; label: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ href, label }));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [href, label]);
  return null;
}

export function ContinueReading() {
  const [last, setLast] = useState<{ href: string; label: string } | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setLast(JSON.parse(v));
    } catch {
      /* sin datos */
    }
  }, []);
  if (!last) return null;
  return (
    <Link
      href={last.href}
      className="flex items-center justify-between rounded-3xl bg-primary px-5 py-4 text-primary-foreground shadow-soft transition hover:bg-primary/90"
    >
      <span>
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">Seguir leyendo</span>
        <span className="font-serif text-xl font-semibold">{last.label}</span>
      </span>
      <span aria-hidden>→</span>
    </Link>
  );
}
