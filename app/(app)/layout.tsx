import { AppNav } from "@/components/app-nav";

/**
 * Shell de las secciones internas: navegación fija + área de contenido.
 * Barra inferior en móvil, lateral en escritorio (md+).
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh md:pl-60">
      <AppNav />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pb-10">
        {children}
      </div>
    </div>
  );
}
