const monthYear = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const fullDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "YYYY-MM" / "YYYY-MM-DD" → "Jul 2026". */
export function formatMonth(partial: string): string {
  const [y, m = "01"] = partial.split("-");
  return monthYear.format(new Date(Date.UTC(Number(y), Number(m) - 1, 1)));
}

export function formatRange(start: string, end: string | null): string {
  return `${formatMonth(start)} — ${end ? formatMonth(end) : "Present"}`;
}

export function formatDate(iso: string): string {
  return fullDate.format(new Date(iso));
}

const ACRONYMS: Record<string, string> = { ai: "AI", iot: "IoT", cloud_devops: "Cloud & DevOps" };

export const humanize = (value: string) =>
  ACRONYMS[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
