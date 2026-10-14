import i18n from "@/i18n";

const locale = () => (i18n.language === "vi" ? "vi-VN" : "en-US");

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale(), { dateStyle: "medium" }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale(), { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

/** "2026-07" / "2026-07-01" → "Jul 2026". */
export function formatMonth(partial: string | null | undefined): string {
  if (!partial) return "—";
  const [y, m = "01"] = partial.split("-");
  return new Intl.DateTimeFormat(locale(), {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(y), Number(m) - 1, 1)));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale()).format(value);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(v)} ${units[i]}`;
}
