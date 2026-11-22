"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestMembership, leaveChurch } from "@/server/churches/membership";

export function MembershipButton({
  churchId,
  slug,
  status,
  signedIn,
}: {
  churchId: string;
  slug: string;
  status: string | null;
  signedIn: boolean;
}) {
  const [current, setCurrent] = useState(status);
  const [pending, start] = useTransition();
  const cls =
    "rounded-full bg-primary-foreground/15 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-primary-foreground/25";

  if (!signedIn) {
    return (
      <Link href={`/ingresar?callbackUrl=/iglesias/${slug}`} className={cls}>
        Soy parte de esta iglesia
      </Link>
    );
  }
  if (current === "active") {
    return (
      <button
        type="button"
        disabled={pending}
        className={cls}
        onClick={() => {
          if (confirm("¿Dejar de figurar como miembro de esta iglesia?"))
            start(async () => {
              const r = await leaveChurch(churchId);
              if (r.ok) setCurrent("left");
            });
        }}
      >
        ✓ Sos miembro
      </button>
    );
  }
  if (current === "requested") return <span className={cls}>Solicitud enviada</span>;
  return (
    <button
      type="button"
      disabled={pending}
      className={cls}
      onClick={() =>
        start(async () => {
          const r = await requestMembership(churchId);
          if (r.ok) setCurrent("requested");
        })
      }
    >
      Soy parte de esta iglesia
    </button>
  );
}
