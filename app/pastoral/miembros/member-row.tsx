"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideMembership } from "@/server/churches/membership";
import { buttonClass, Badge } from "@/components/ui";

export function MemberRow({
  churchId,
  member,
}: {
  churchId: string;
  member: { userId: string; name: string | null; email: string | null; status: string; linkedAt: string };
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const act = (d: "active" | "declined" | "left") =>
    start(async () => {
      await decideMembership(churchId, member.userId, d);
      router.refresh();
    });
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface p-4">
      <div className="min-w-0">
        <p className="font-medium">{member.name ?? "Sin nombre"}</p>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
      </div>
      {member.status === "requested" ? (
        <div className="flex gap-2">
          <button disabled={pending} onClick={() => act("active")} className={buttonClass("primary", "px-4 py-2")}>Aprobar</button>
          <button disabled={pending} onClick={() => act("declined")} className={buttonClass("secondary", "px-4 py-2")}>Rechazar</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Badge tone="primary">Miembro</Badge>
          <button disabled={pending} onClick={() => confirm("¿Quitar a esta persona de la lista de miembros?") && act("left")} className={buttonClass("ghost")}>
            Quitar
          </button>
        </div>
      )}
    </li>
  );
}
