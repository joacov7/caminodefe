/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Paquetes que solo deben ejecutarse en el servidor (driver de Neon).
  serverExternalPackages: ["@neondatabase/serverless"],
};

export default nextConfig;
