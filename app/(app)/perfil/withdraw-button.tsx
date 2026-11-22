"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdrawContactRequest } from "@/server/churches/actions";

export function WithdrawButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        confirm("¿Retirar este mensaje?") &&
        start(async () => {
          await withdrawContactRequest(id);
          router.refresh();
        })
      }
      className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
    >
      Retirar
    </button>
  );
}
