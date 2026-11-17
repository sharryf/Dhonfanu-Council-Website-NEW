import type { Locale } from "./i18n";

// All dates are shown in Maldives time (UTC+5, no daylight saving).
const TZ = "Indian/Maldives";
const TZ_OFFSET = "+05:00";

const DV_MONTHS = [
  "ޖެނުއަރީ",
  "ފެބްރުއަރީ",
  "މާރިޗު",
  "އޭޕްރީލް",
  "މޭ",
  "ޖޫން",
  "ޖުލައި",
  "އޮގަސްޓު",
  "ސެޕްޓެންބަރު",
  "އޮކްޓޫބަރު",
  "ނޮވެންބަރު",
  "ޑިސެންބަރު",
];

function parts(date: Date) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => p.find((x) => x.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

export function formatDate(date: Date | string | null | undefined, locale: Locale): string {
  if (!date) return "";
  const d = new Date(date);
  if (locale === "dv") {
    const p = parts(d);
    return `${Number(p.day)} ${DV_MONTHS[Number(p.month) - 1]} ${p.year}`;
  }
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined, locale: Locale): string {
  if (!date) return "";
  const p = parts(new Date(date));
  return `${formatDate(date, locale)}, ${p.hour}:${p.minute}`;
}

/** Value for <input type="datetime-local"> in Maldives time. */
export function toDateTimeInput(date: Date | null | undefined): string {
  if (!date) return "";
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Value for <input type="date"> in Maldives time. */
export function toDateInput(date: Date | null | undefined): string {
  if (!date) return "";
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Parses "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" entered in Maldives time. */
export function parseLocalInput(value: string | null | undefined, endOfDay = false): Date | null {
  if (!value) return null;
  const v = value.trim();
  let iso: string;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) iso = `${v}T${endOfDay ? "23:59" : "00:00"}:00${TZ_OFFSET}`;
  else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) iso = `${v}:00${TZ_OFFSET}`;
  else return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** null = no deadline; true = still open; false = closed. */
export function deadlineStatus(deadline: Date | string | null | undefined): boolean | null {
  if (!deadline) return null;
  return new Date(deadline).getTime() >= Date.now();
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
