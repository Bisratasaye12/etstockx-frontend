export type HighlightSegment = {
  text: string;
  match: boolean;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Splits `text` into segments around (case-insensitive) occurrences of
 * `keyword`. Used by the thread search view to render the yellow highlight
 * pill seen in the Figma without dangerouslySetInnerHTML.
 */
export function highlightText(
  text: string | null | undefined,
  keyword: string,
): HighlightSegment[] {
  const value = text ?? "";
  const k = keyword.trim();
  if (!value) return [];
  if (!k) return [{ text: value, match: false }];

  const re = new RegExp(escapeRegex(k), "gi");
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(value)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ text: value.slice(lastIndex, m.index), match: false });
    }
    segments.push({ text: m[0], match: true });
    lastIndex = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  if (lastIndex < value.length) {
    segments.push({ text: value.slice(lastIndex), match: false });
  }
  return segments;
}
