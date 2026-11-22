import Link from "next/link";
import { Logo } from "./app-nav";
import { ConsoleTabs } from "./console-tabs";

/**
 * Marco de los paneles profesionales (pastoral y administración): barra
 * superior sobria, pestañas y contenido ancho. Mismo sistema de diseño que la
 * app, con más densidad de información.
 */
export function ConsoleShell({
  title,
  tabs,
  children,
}: {
  title: string;
  tabs: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/inicio" className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="font-serif text-lg font-semibold">Camino de Fe</span>
            <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground sm:inline">
              {title}
            </span>
          </Link>
          <Link href="/inicio" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Volver a la app
          </Link>
        </div>
        <ConsoleTabs tabs={tabs} />
      </header>
      <main id="contenido" className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
