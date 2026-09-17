"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createNote,
  deleteNote,
  addJournalEntry,
  deleteJournalEntry,
  removeFavorite,
} from "@/server/camino/actions";

type Note = {
  id: string;
  title: string | null;
  body: string;
  linkedRef: string | null;
  updatedAt: string;
};
type JournalEntry = { id: string; entry: string; createdAt: string };
type Favorite = { id: string; refType: string; refId: string; label: string | null };

type Tab = "notas" | "diario" | "favoritos";

export function MiCamino({
  notes,
  journal,
  favorites,
}: {
  notes: Note[];
  journal: JournalEntry[];
  favorites: Favorite[];
}) {
  const [tab, setTab] = useState<Tab>("notas");

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Mi Camino</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Privado. Nadie más (ni tu iglesia) ve esto por defecto.
        </p>
      </header>

      <nav className="flex gap-2" role="tablist" aria-label="Secciones">
        {(["notas", "diario", "favoritos"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "notas" && <NotesSection notes={notes} />}
      {tab === "diario" && <JournalSection journal={journal} />}
      {tab === "favoritos" && <FavoritesSection favorites={favorites} />}
    </main>
  );
}

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        after?.();
        router.refresh();
      } else {
        setError(res.error ?? "Error.");
      }
    });
  }
  return { pending, error, run };
}

function NotesSection({ notes }: { notes: Note[] }) {
  const { pending, error, run } = useAction();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <section className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createNote({ title: title || undefined, body }), () => {
            setTitle("");
            setBody("");
          });
        }}
        className="flex flex-col gap-2 rounded-2xl border border-border p-4"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          aria-label="Título de la nota"
          className="bg-transparent text-sm outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Escribí tu nota…"
          aria-label="Contenido de la nota"
          className="resize-none bg-transparent text-sm outline-none"
        />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="self-start rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          Guardar nota
        </button>
      </form>
      {error && <p className="text-sm text-muted-foreground">{error}</p>}

      {notes.length === 0 ? (
        <Empty>Todavía no tenés notas.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-border p-4">
              {n.title && <p className="font-medium">{n.title}</p>}
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {n.body}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                {n.linkedRef && (
                  <span className="text-primary">{n.linkedRef}</span>
                )}
                <button
                  onClick={() => run(() => deleteNote(n.id))}
                  disabled={pending}
                  className="text-muted-foreground hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function JournalSection({ journal }: { journal: JournalEntry[] }) {
  const { pending, error, run } = useAction();
  const [entry, setEntry] = useState("");

  return (
    <section className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addJournalEntry({ entry }), () => setEntry(""));
        }}
        className="flex flex-col gap-2 rounded-2xl border border-border p-4"
      >
        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          rows={3}
          placeholder="¿Qué querés reflexionar hoy?"
          aria-label="Entrada del diario"
          className="resize-none bg-transparent text-sm outline-none"
        />
        <button
          type="submit"
          disabled={pending || !entry.trim()}
          className="self-start rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          Agregar entrada
        </button>
      </form>
      {error && <p className="text-sm text-muted-foreground">{error}</p>}

      {journal.length === 0 ? (
        <Empty>Tu diario está vacío.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {journal.map((j) => (
            <li key={j.id} className="rounded-xl border border-border p-4">
              <p className="whitespace-pre-wrap text-sm">{j.entry}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(j.createdAt).toLocaleDateString("es-AR")}</span>
                <button
                  onClick={() => run(() => deleteJournalEntry(j.id))}
                  disabled={pending}
                  className="hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FavoritesSection({ favorites }: { favorites: Favorite[] }) {
  const { pending, error, run } = useAction();

  function hrefFor(f: Favorite): string | null {
    if (f.refType === "bible_chapter") return `/biblia/${f.refId}`;
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      {error && <p className="text-sm text-muted-foreground">{error}</p>}
      {favorites.length === 0 ? (
        <Empty>
          Todavía no guardaste favoritos. Guardá capítulos desde la{" "}
          <Link href="/biblia" className="text-primary hover:underline">
            Biblia
          </Link>
          .
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {favorites.map((f) => {
            const href = hrefFor(f);
            return (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
              >
                {href ? (
                  <Link href={href} className="text-primary hover:underline">
                    {f.label ?? f.refId}
                  </Link>
                ) : (
                  <span>{f.label ?? f.refId}</span>
                )}
                <button
                  onClick={() => run(() => removeFavorite(f.id))}
                  disabled={pending}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
