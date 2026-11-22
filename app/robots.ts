import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Áreas privadas o sin valor de búsqueda.
        disallow: ["/api/", "/admin", "/pastoral", "/perfil", "/mi-camino", "/asistente", "/ingresar"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
