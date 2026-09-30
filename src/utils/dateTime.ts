export const PHILIPPINE_TIME_ZONE = "Asia/Manila";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_WITHOUT_ZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/;
const EXPLICIT_TIME_ZONE_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export function toLocalDateInputValue(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateInput(value?: string | null): Date | null {
  if (!value) return null;
  const match = DATE_ONLY_PATTERN.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);
  parsed.setHours(0, 0, 0, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function parseBackendTimestamp(value?: string | null): Date | null {
  if (!value) return null;
  const normalized = value.trim().replace(" ", "T");
  if (!normalized) return null;

  const dateOnly = DATE_ONLY_PATTERN.exec(normalized);
  const canonical = dateOnly
    ? `${normalized}T00:00:00+08:00`
    : DATE_TIME_WITHOUT_ZONE_PATTERN.test(normalized) &&
        !EXPLICIT_TIME_ZONE_PATTERN.test(normalized)
      ? `${normalized}Z`
      : normalized;
  const parsed = new Date(canonical);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPhilippineDateParts(date: Date): {
  year: string;
  month: string;
  day: string;
} | null {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PHILIPPINE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? { year, month, day } : null;
}

export function toPhilippineDateKey(value?: string | null): string {
  if (!value) return "";
  const normalized = value.trim().replace(" ", "T");
  if (DATE_ONLY_PATTERN.test(normalized)) return normalized;

  const parsed = parseBackendTimestamp(normalized);
  if (!parsed) return "";
  const parts = getPhilippineDateParts(parsed);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
}

export function formatPhilippineDate(
  value?: string | null,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  fallback = "-",
): string {
  const parsed = parseBackendTimestamp(value);
  if (!parsed) return fallback;
  return parsed.toLocaleDateString("en-PH", {
    ...options,
    timeZone: PHILIPPINE_TIME_ZONE,
  });
}

export function formatPhilippineDateTime(
  value?: string | null,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  },
  fallback = "-",
): string {
  const parsed = parseBackendTimestamp(value);
  if (!parsed) return fallback;
  return parsed.toLocaleString("en-PH", {
    ...options,
    timeZone: PHILIPPINE_TIME_ZONE,
  });
}

export function getInclusiveDefaultRange(
  referenceDate: Date = new Date(),
  days = 30,
): { start: string; end: string } {
  const safeDays = Math.max(1, Math.trunc(days));
  const end = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const start = new Date(end);
  start.setDate(start.getDate() - (safeDays - 1));
  return {
    start: toLocalDateInputValue(start),
    end: toLocalDateInputValue(end),
  };
}

function addCalendarYearsClamped(date: Date, years: number): Date {
  const targetYear = date.getFullYear() + years;
  const targetMonth = date.getMonth();
  const targetDay = date.getDate();
  const result = new Date(targetYear, targetMonth, targetDay);
  if (result.getMonth() !== targetMonth) result.setDate(0);
  return result;
}

export function getMaxCalendarEndDate(
  startDateInput: string,
  today: Date = new Date(),
): string {
  const start = parseLocalDateInput(startDateInput);
  if (!start) return toLocalDateInputValue(today);

  const max = addCalendarYearsClamped(start, 1);
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return toLocalDateInputValue(max < localToday ? max : localToday);
}

export function isWithinCalendarYears(
  startInput: string,
  endInput: string,
  years = 1,
): boolean {
  const start = parseLocalDateInput(startInput);
  const end = parseLocalDateInput(endInput);
  if (!start || !end || end < start) return false;
  return end <= addCalendarYearsClamped(start, Math.max(0, Math.trunc(years)));
}

export function getInclusiveDayCount(startInput: string, endInput: string): number {
  const start = parseLocalDateInput(startInput);
  const end = parseLocalDateInput(endInput);
  if (!start || !end || end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function isPhilippineDateInRange(
  value: string | null | undefined,
  startInput?: string,
  endInput?: string,
): boolean {
  const key = toPhilippineDateKey(value);
  if (!key) return false;
  if (startInput && key < startInput) return false;
  if (endInput && key > endInput) return false;
  return true;
}