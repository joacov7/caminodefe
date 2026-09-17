"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const items: NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: <IconHome /> },
  { href: "/asistente", label: "Asistente", icon: <IconChat /> },
  { href: "/biblia", label: "Biblia", icon: <IconBook /> },
  { href: "/mi-camino", label: "Mi Camino", icon: <IconPath /> },
  { href: "/iglesias", label: "Iglesias", icon: <IconChurch /> },
  { href: "/perfil", label: "Perfil", icon: <IconUser /> },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:inset-y-0 md:right-auto md:w-60 md:border-r md:border-t-0"
    >
      <div className="flex md:h-full md:flex-col md:gap-1 md:p-4">
        <p className="hidden px-3 py-4 text-lg font-semibold text-primary md:block">
          Camino de Fe
        </p>
        <ul className="flex flex-1 md:flex-col md:gap-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-1 md:flex-none">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium transition",
                    "md:flex-row md:gap-3 md:rounded-lg md:px-3 md:py-2 md:text-sm",
                    active
                      ? "text-primary md:bg-muted"
                      : "text-muted-foreground hover:text-foreground md:hover:bg-muted/60",
                  ].join(" ")}
                >
                  <span aria-hidden className="h-5 w-5">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

/* --- Íconos (SVG inline, heredan currentColor) --- */
function base(children: React.ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      {children}
    </svg>
  );
}
function IconHome() {
  return base(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>);
}
function IconChat() {
  return base(<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-4.5A8 8 0 1 1 21 12Z" />);
}
function IconBook() {
  return base(<><path d="M4 5a2 2 0 0 1 2-2h11v16H6a2 2 0 0 0-2 2Z" /><path d="M17 3v16" /></>);
}
function IconPath() {
  return base(<path d="M6 20c0-4 12-4 12-8s-8-4-8-8" />);
}
function IconChurch() {
  return base(<><path d="M12 3v6" /><path d="M9 6h6" /><path d="M6 21v-8l6-3 6 3v8" /><path d="M10 21v-4h4v4" /></>);
}
function IconUser() {
  return base(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>);
}
