"use client";

import { Fragment } from "react";
import { highlightText } from "@/features/messaging/lib/highlight-text";

type Props = {
  text: string | null | undefined;
  keyword: string;
};

export function HighlightedText({ text, keyword }: Props) {
  const segments = highlightText(text, keyword);
  if (segments.length === 0) return null;

  return (
    <>
      {segments.map((s, i) =>
        s.match ? (
          <mark
            key={i}
            className="rounded-sm bg-amber-200/80 px-0.5 text-foreground"
          >
            {s.text}
          </mark>
        ) : (
          <Fragment key={i}>{s.text}</Fragment>
        ),
      )}
    </>
  );
}
