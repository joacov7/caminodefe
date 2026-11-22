import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { siteUrl } from "@/lib/site";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

// Tipografía: Plus Jakarta Sans (interfaz, legible y moderna) + Fraunces
// (títulos y lectura bíblica: serif cálida, con carácter, sin solemnidad).
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Camino de Fe — La Biblia, tu camino y tu iglesia",
    template: "%s · Camino de Fe",
  },
  description:
    "Leé la Biblia, empezá tu camino de fe paso a paso, encontrá una iglesia cerca y " +
    "consultá un asistente bíblico responsable. Gratis.",
  applicationName: "Camino de Fe",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Camino de Fe",
  },
  appleWebApp: { capable: true, title: "Camino de Fe", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f0" },
    { media: "(prefers-color-scheme: dark)", color: "#11171a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Saltar al contenido
        </a>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
