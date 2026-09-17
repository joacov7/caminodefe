import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Camino de Fe",
    short_name: "Camino de Fe",
    description:
      "Asistente bíblico, lecturas, devocionales y conexión con tu iglesia local.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#3a7a63",
    lang: "es",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
