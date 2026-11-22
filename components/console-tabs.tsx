"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ConsoleTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones" className="mx-auto max-w-5xl overflow-x-auto px-4 sm:px-6">
      <ul className="flex gap-1">
        {tabs.map((t) => {
          const active = pathname === t.href || (t.href.split("/").length > 2 && pathname.startsWith(t.href + "/"));
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
