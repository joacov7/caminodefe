"use client";

import { useEffect } from "react";

/** Registra el service worker (solo en producción, si el navegador lo soporta). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);
  return null;
}

/** Borra las copias locales de páginas (llamar al cerrar sesión). */
export function clearOfflinePages() {
  try {
    navigator.serviceWorker?.controller?.postMessage("clear-pages");
  } catch {
    /* sin service worker */
  }
}
