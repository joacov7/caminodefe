import { ConsoleShell } from "@/components/console-shell";

export default function PastoralLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell
      title="Panel pastoral"
      tabs={[
        { href: "/pastoral", label: "Bandeja" },
        { href: "/pastoral/eventos", label: "Eventos" },
        { href: "/pastoral/miembros", label: "Miembros" },
      ]}
    >
      {children}
    </ConsoleShell>
  );
}
