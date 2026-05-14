"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/shared/lib/utils";

export function MfaSixDigitFields({
  idPrefix,
  value,
  onChange,
  disabled,
  invalid,
}: {
  idPrefix: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusAt = useCallback((i: number) => {
    const el = refs.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  function handlePaste(index: number, e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const slots = (value + "      ").slice(0, 6).split("");
    for (let i = 0; i < text.length && index + i < 6; i += 1) {
      slots[index + i] = text[i]!;
    }
    onChange(slots.join("").replace(/ /g, "").slice(0, 6));
    const nextFocus = Math.min(index + text.length, 5);
    requestAnimationFrame(() => focusAt(nextFocus));
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5">
      {Array.from({ length: 6 }, (_, i) => {
        const ch = value[i] ?? "";
        return (
          <input
            key={`${idPrefix}-${i}`}
            id={`${idPrefix}-${i}`}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled}
            value={ch}
            onPaste={(e) => handlePaste(i, e)}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              const slots = (value + "      ").slice(0, 6).split("");
              if (v.length === 0) {
                slots[i] = " ";
                onChange(slots.join("").replace(/ /g, ""));
                if (i > 0) requestAnimationFrame(() => focusAt(i - 1));
                return;
              }
              const last = v.slice(-1) ?? "";
              slots[i] = last;
              onChange(slots.join("").replace(/ /g, "").slice(0, 6));
              if (last && i < 5) requestAnimationFrame(() => focusAt(i + 1));
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !ch && i > 0) {
                e.preventDefault();
                focusAt(i - 1);
              }
              if (e.key === "ArrowLeft" && i > 0) {
                e.preventDefault();
                focusAt(i - 1);
              }
              if (e.key === "ArrowRight" && i < 5) {
                e.preventDefault();
                focusAt(i + 1);
              }
            }}
            className={cn(
              "border-input bg-background text-foreground flex size-11 items-center justify-center rounded-lg border text-center text-lg font-semibold shadow-sm sm:size-12 sm:text-xl",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              invalid &&
                "border-destructive ring-destructive/30 text-destructive",
            )}
            aria-invalid={invalid}
          />
        );
      })}
    </div>
  );
}
