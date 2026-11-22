/**
 * Generación de calendarios iCalendar (RFC 5545) — PURA y testeable.
 * Permite recordatorios y eventos en CUALQUIER teléfono (Google Calendar,
 * Apple Calendar, Outlook) sin notificaciones push ni costos de envío.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Fecha UTC en formato básico: 20261122T150000Z */
export function icsDateUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Escapa texto según RFC 5545 §3.3.11. */
export function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Pliega líneas a 75 octetos (RFC 5545 §3.1). */
export function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const ch of line) {
    if (Buffer.byteLength(current + ch, "utf8") > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = ch;
    } else current += ch;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function calendar(lines: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Camino de Fe//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...lines,
    "END:VCALENDAR",
  ]
    .map(foldLine)
    .join("\r\n") + "\r\n";
}

const ICS_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export type ReminderIcsInput = {
  time: string; // HH:MM local
  days: number[]; // 0 = domingo
  timezone: string;
  url: string;
  start?: Date;
};

/** Recordatorio diario/semanal recurrente con alarma, en la zona del usuario. */
export function buildReminderIcs(input: ReminderIcsInput): string {
  const [hh, mm] = input.time.split(":").map(Number);
  const start = input.start ?? new Date();
  const dtstart = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(hh!)}${pad(mm!)}00`;
  const days = [...new Set(input.days)].sort().map((d) => ICS_DAYS[d]).filter(Boolean);
  return calendar([
    "BEGIN:VEVENT",
    `UID:recordatorio-${dtstart}@caminodefe`,
    `DTSTAMP:${icsDateUtc(new Date())}`,
    `DTSTART;TZID=${input.timezone}:${dtstart}`,
    "DURATION:PT10M",
    `RRULE:FREQ=WEEKLY;BYDAY=${days.join(",")}`,
    `SUMMARY:${icsEscape("Tu momento con Dios · Camino de Fe")}`,
    `DESCRIPTION:${icsEscape(`Unos minutos de lectura y oración. ${input.url}`)}`,
    `URL:${input.url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape("Tu momento con Dios")}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
  ]);
}

export type EventIcsInput = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  url: string;
};

export function buildEventIcs(e: EventIcsInput): string {
  const end = e.endsAt ?? new Date(e.startsAt.getTime() + 90 * 60_000);
  return calendar([
    "BEGIN:VEVENT",
    `UID:evento-${e.id}@caminodefe`,
    `DTSTAMP:${icsDateUtc(new Date())}`,
    `DTSTART:${icsDateUtc(e.startsAt)}`,
    `DTEND:${icsDateUtc(end)}`,
    `SUMMARY:${icsEscape(e.title)}`,
    ...(e.description ? [`DESCRIPTION:${icsEscape(`${e.description}\n${e.url}`)}`] : []),
    ...(e.location ? [`LOCATION:${icsEscape(e.location)}`] : []),
    `URL:${e.url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(e.title)}`,
    "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
  ]);
}
