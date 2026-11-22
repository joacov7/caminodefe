/**
 * Componentes base del sistema de diseño (server-friendly, sin estado).
 * Unifican tarjetas, botones, encabezados y estados vacíos que antes se
 * repetían en cada página.
 */
import Link from "next/link";

type Children = { children: React.ReactNode };

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 animate-rise sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        )}
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-[2.1rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-prose text-pretty text-[0.95rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function Card({
  children,
  className,
  as: Tag = "section",
}: Children & { className?: string; as?: "section" | "article" | "div" | "li" }) {
  return (
    <Tag className={cx("rounded-3xl border border-border/80 bg-surface p-5 shadow-soft sm:p-6", className)}>
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, action }: Children & { action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
const btnVariants = {
  primary: "bg-primary px-5 py-2.5 text-primary-foreground shadow-soft hover:bg-primary/90",
  secondary: "border border-border bg-surface px-5 py-2.5 text-foreground hover:bg-muted",
  ghost: "px-3 py-2 text-primary hover:bg-primary-soft",
  accent: "bg-accent px-5 py-2.5 text-accent-foreground shadow-soft hover:bg-accent/90",
  danger: "border border-danger/30 px-4 py-2 text-danger hover:bg-danger/10",
} as const;
export type ButtonVariant = keyof typeof btnVariants;

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cx(btnBase, btnVariants[variant], className);
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  ...rest
}: Children & {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  target?: string;
  rel?: string;
  download?: boolean;
}) {
  // Descargas, rutas de API y enlaces externos: <a> simple (sin prefetch de Next).
  if (href.startsWith("/api/") || /^https?:\/\//.test(href)) {
    return (
      <a href={href} className={buttonClass(variant, className)} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: Children & { tone?: "neutral" | "primary" | "accent" | "danger" }) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent-foreground",
    danger: "bg-danger/10 text-danger",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: Children & { title: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <div className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{children}</div>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({ children, tone = "neutral" }: Children & { tone?: "neutral" | "accent" }) {
  return (
    <p
      role="note"
      className={cx(
        "rounded-2xl px-4 py-3 text-sm",
        tone === "accent" ? "bg-accent-soft text-accent-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-soft">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Barra de progreso accesible (sin connotación competitiva). */
export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function LinkRow({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-surface px-4 py-3.5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      {icon && (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{icon}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{title}</span>
        {desc && <span className="block truncate text-sm text-muted-foreground">{desc}</span>}
      </span>
      <span aria-hidden className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary">
        →
      </span>
    </Link>
  );
}
