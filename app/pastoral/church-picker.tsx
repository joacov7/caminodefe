import Link from "next/link";

/** Selector de iglesia para quien gestiona más de una. */
export function ChurchPicker({
  churches,
  selectedId,
  basePath,
}: {
  churches: { id: string; name: string }[];
  selectedId: string;
  basePath: string;
}) {
  if (churches.length < 2) return null;
  return (
    <nav aria-label="Iglesia" className="flex flex-wrap gap-2">
      {churches.map((c) => (
        <Link
          key={c.id}
          href={`${basePath}?church=${c.id}`}
          aria-current={c.id === selectedId ? "true" : undefined}
          className={`rounded-full border px-3 py-1 text-sm ${
            c.id === selectedId ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground"
          }`}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
