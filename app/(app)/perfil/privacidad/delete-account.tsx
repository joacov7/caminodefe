"use client";

import { useState, useTransition } from "react";
import { deleteMyAccount } from "@/server/account/actions";
import { DELETE_CONFIRMATION } from "@/server/account/constants";
import { buttonClass } from "@/components/ui";

export function DeleteAccount() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      action={() =>
        start(async () => {
          const r = await deleteMyAccount(value);
          if (r && !r.ok) setError(r.error);
        })
      }
      className="flex flex-col gap-3"
    >
      <label htmlFor="confirm" className="label">
        Escribí <strong>{DELETE_CONFIRMATION}</strong> para confirmar
      </label>
      <input id="confirm" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" className="input max-w-xs" />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending || value.trim().toUpperCase() !== DELETE_CONFIRMATION}
        className={buttonClass("danger", "self-start")}
      >
        {pending ? "Eliminando…" : "Eliminar mi cuenta"}
      </button>
    </form>
  );
}
