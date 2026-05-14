/**
 * Derives up to two avatar initials from a conversation counterparty name.
 * Returns the fallback (default "?") when the name is null/empty.
 */
export function getConversationInitials(
  name: string | null | undefined,
  fallback: string = "?",
): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return fallback;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;

  const first = parts[0]?.charAt(0) ?? "";
  const last =
    parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";

  const result = (first + last).toUpperCase();
  return result || fallback;
}
