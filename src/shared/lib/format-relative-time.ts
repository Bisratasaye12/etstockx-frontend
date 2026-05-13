/**
 * Short relative time for notification timestamps (e.g. "2m ago", "1h ago").
 */
export function formatRelativeTimeShort(
  date: Date,
  now: Date = new Date(),
  locale: string = "en",
): string {
  const sec = Math.round((now.getTime() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const abs = Math.abs(sec);
  if (abs < 45) return rtf.format(-sec, "second");
  if (abs < 3600) return rtf.format(-Math.round(sec / 60), "minute");
  if (abs < 86400) return rtf.format(-Math.round(sec / 3600), "hour");
  if (abs < 604800) return rtf.format(-Math.round(sec / 86400), "day");
  if (abs < 2629800) return rtf.format(-Math.round(sec / 604800), "week");
  if (abs < 31557600) return rtf.format(-Math.round(sec / 2629800), "month");
  return rtf.format(-Math.round(sec / 31557600), "year");
}
