/** Past-only relative labels for conversation list rows. */
export function formatConversationListTime(
  iso: string,
  t: (key: string, values?: { count: number }) => string,
): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return t("listRelative.justNow");
  if (mins < 60) return t("listRelative.minutes", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("listRelative.hours", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("listRelative.days", { count: days });
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return t("listRelative.weeks", { count: weeks });
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
