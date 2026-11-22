"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconBook,
  IconPath,
  IconChat,
  IconGrid,
  IconChurch,
  IconCalendar,
  IconBookmark,
  IconUser,
  IconFlame,
} from "./icons";

type NavItem = { href: string; label: string; icon: React.ReactNode; match?: string[] };

// Móvil: 5 destinos (regla de pulgar). El resto vive en "Más".
const mobile: NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: <IconHome /> },
  { href: "/biblia", label: "Biblia", icon: <IconBook /> },
  { href: "/camino", label: "Camino", icon: <IconPath /> },
  { href: "/asistente", label: "Asistente", icon: <IconChat /> },
  {
    href: "/perfil",
    label: "Más",
    icon: <IconGrid />,
    match: ["/perfil", "/iglesias", "/eventos", "/planes", "/mi-camino", "/plan", "/apoyar", "/contenidos"],
  },
];

const desktop: { title: string; items: NavItem[] }[] = [
  {
    title: "Crecer",
    items: [
      { href: "/inicio", label: "Inicio", icon: <IconHome /> },
      { href: "/biblia", label: "Biblia", icon: <IconBook /> },
      { href: "/camino", label: "Camino guiado", icon: <IconPath /> },
      { href: "/planes", label: "Planes de lectura", icon: <IconFlame /> },
      { href: "/asistente", label: "Asistente bíblico", icon: <IconChat /> },
    ],
  },
  {
    title: "Comunidad",
    items: [
      { href: "/iglesias", label: "Iglesias", icon: <IconChurch /> },
      { href: "/eventos", label: "Eventos", icon: <IconCalendar /> },
    ],
  },
  {
    title: "Personal",
    items: [
      { href: "/mi-camino", label: "Mi espacio", icon: <IconBookmark /> },
      { href: "/perfil", label: "Perfil", icon: <IconUser /> },
    ],
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  const targets = item.match ?? [item.href];
  return targets.some((h) => pathname === h || pathname.startsWith(h + "/"));
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Escritorio: barra lateral */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/70 bg-surface/80 px-4 py-6 backdrop-blur md:flex"
      >
        <Link href="/inicio" className="mb-8 flex items-center gap-2.5 px-3">
          <Logo />
          <span className="font-serif text-xl font-semibold tracking-tight">Camino de Fe</span>
        </Link>
        <div className="flex flex-1 flex-col gap-6">
          {desktop.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                {group.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                          active
                            ? "bg-primary-soft text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        ].join(" ")}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="px-3 text-xs leading-relaxed text-muted-foreground">
          Una herramienta para acompañar tu fe. No reemplaza a tu iglesia ni a tu pastor.
        </p>
      </nav>

      {/* Móvil: barra inferior */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      >
        <ul className="flex">
          {mobile.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex flex-col items-center gap-1 pb-2 pt-2.5 text-[0.7rem] font-medium transition",
                    active ? "text-primary" : "text-muted-foreground",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid h-7 w-12 place-items-center rounded-full transition",
                      active ? "bg-primary-soft" : "",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

/** Marca: un sendero que asciende hacia la luz (sin clichés). */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <circle cx="21.5" cy="10" r="3.2" className="fill-accent" />
      <path
        d="M8 25c3.5 0 4-4 7.5-5.5S22 18 23 14"
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="stroke-primary-foreground"
      />
    </svg>
  );
}
