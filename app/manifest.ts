import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Camino de Fe",
    short_name: "Camino de Fe",
    description: "Conocé a Jesús, leé la Biblia cada día y encontrá una iglesia cerca. Gratis y privado.",
    id: "/inicio",
    start_url: "/inicio?fuente=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf7f0",
    theme_color: "#26604f",
    lang: "es",
    dir: "ltr",
    categories: ["books", "education", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Leer la Biblia", url: "/biblia", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Camino guiado", url: "/camino", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Preguntar", url: "/asistente", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
