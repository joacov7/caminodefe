import { AppNav } from "@/components/app-nav";

/**
 * Shell de las secciones internas: navegación fija + área de contenido.
 * Barra inferior en móvil, lateral en escritorio (md+).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:pl-64">
      <AppNav />
      <div
        id="contenido"
        className="mx-auto max-w-3xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:pb-14 md:pt-10"
      >
        {children}
      </div>
    </div>
  );
}
