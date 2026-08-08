/**
 * Body weight entries are calendar dates, not instants. To avoid off-by-one
 * shifts from timezone conversion, a "YYYY-MM-DD" string is always stored as
 * UTC midnight and always read back using UTC accessors — never local ones.
 */

export function dateOnlyToUTCDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function formatDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function displayDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: options?.year === undefined ? undefined : "numeric",
    ...options,
  }).format(d);
}

export function todayDateOnly(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
