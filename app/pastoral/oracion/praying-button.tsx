"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPraying } from "@/server/prayer/actions";
import { buttonClass } from "@/components/ui";

export function PrayingButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => { await markPraying(id); router.refresh(); })}
      className={buttonClass("primary", "px-4 py-2")}
    >
      Estamos orando
    </button>
  );
}
