"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/server/camino/actions";

export function FavoriteButton({
  refId,
  label,
}: {
  refId: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [favorited, setFavorited] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function onClick() {
    setMsg(null);
    startTransition(async () => {
      const res = await toggleFavorite({ refType: "bible_chapter", refId, label });
      if (res.ok) setFavorited(res.data?.favorited ?? null);
      else setMsg(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        disabled={pending}
        aria-pressed={favorited ?? false}
        className="rounded-full border border-border px-3 py-1 text-xs transition hover:bg-muted disabled:opacity-50"
      >
        {favorited ? "★ Guardado" : "☆ Guardar"}
      </button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
}
