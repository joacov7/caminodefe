"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "@/server/events/actions";
import { buttonClass } from "@/components/ui";

export function AdminDeleteEvent({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => confirm("¿Eliminar este evento?") && start(async () => { await deleteEvent(id); router.refresh(); })}
      className={buttonClass("danger", "px-3 py-1.5 text-xs")}
    >
      Eliminar
    </button>
  );
}
