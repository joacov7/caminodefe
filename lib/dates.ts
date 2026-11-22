/** Formatos de fecha en español (Argentina), en la zona horaria local. */
const TZ = "America/Argentina/Buenos_Aires";

export function formatEventDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}

export function formatLongDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(date);
}

export function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(date);
}

/** Partes para una "tarjeta calendario" (día y mes abreviado). */
export function dateBadge(d: Date | string): { day: string; month: string } {
  const date = typeof d === "string" ? new Date(d) : d;
  const day = new Intl.DateTimeFormat("es-AR", { day: "numeric", timeZone: TZ }).format(date);
  const month = new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: TZ }).format(date).replace(".", "");
  return { day, month };
}
