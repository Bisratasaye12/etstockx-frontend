/** Relative "Saved … ago" for watchlist rows (coarse buckets). */
export function formatWatchlistSavedRelative(
  iso: string,
  t: (key: string, values?: { count: number }) => string,
): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return t("saved.justNow");
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return t("saved.justNow");
  if (minutes < 60) return t("saved.minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("saved.hours", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("saved.days", { count: days });
  const weeks = Math.floor(days / 7);
  return t("saved.weeks", { count: Math.max(1, weeks) });
}
