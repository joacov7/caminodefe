import { ConsoleShell } from "@/components/console-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell
      title="Administración"
      tabs={[
        { href: "/admin", label: "Métricas" },
        { href: "/admin/iglesias", label: "Iglesias" },
        { href: "/admin/contenido", label: "Contenido" },
        { href: "/admin/biblioteca", label: "Biblioteca IA" },
        { href: "/admin/eventos", label: "Eventos" },
        { href: "/admin/auditoria", label: "Auditoría" },
      ]}
    >
      {children}
    </ConsoleShell>
  );
}
