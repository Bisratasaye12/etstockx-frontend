/**
 * Compact file-size string for attachment cards ("128 KB", "3.4 MB").
 * Decimal (1000) base, matching the Figma copy convention.
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) {
    return `${Math.round(bytes / 1000)} KB`;
  }
  if (bytes < 1_000_000_000) {
    const mb = bytes / 1_000_000;
    return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
  }
  const gb = bytes / 1_000_000_000;
  return `${gb >= 10 ? Math.round(gb) : gb.toFixed(1)} GB`;
}
