/** @type {import('next').NextConfig} */

// Cabeceras de seguridad para todas las rutas.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Paquetes que solo deben ejecutarse en el servidor (drivers de base de datos).
  serverExternalPackages: ["@neondatabase/serverless", "pg"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // El service worker nunca debe quedar cacheado por el navegador/CDN.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
    ];
  },
};

export default nextConfig;
