/**
 * Time-of-day string used inside the thread (e.g. "09:41 AM", "10:15 AM").
 * The Figma uses 12-hour English format with uppercase meridiem.
 */
export function formatMessageTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const intlLocale = locale === "am" ? "am-ET" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
