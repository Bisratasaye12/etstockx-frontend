"use client";

import { useId, useState } from "react";
import { Info } from "lucide-react";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";

type FieldLabelWithInfoProps = {
  htmlFor: string;
  label: string;
  hint: string;
  required?: boolean;
};

export function FieldLabelWithInfo({
  htmlFor,
  label,
  hint,
  required,
}: FieldLabelWithInfoProps) {
  const hintId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor}>
          {label}
          {required ? (
            <span className="text-destructive ml-0.5" aria-hidden>
              *
            </span>
          ) : null}
        </Label>
        <button
          type="button"
          className={cn(
            "text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          )}
          aria-label={hint}
          aria-expanded={open}
          aria-controls={hintId}
          onClick={() => setOpen((v) => !v)}
        >
          <Info className="size-4" aria-hidden />
        </button>
      </div>
      {open ? (
        <p
          id={hintId}
          className="text-muted-foreground text-xs leading-relaxed"
          role="note"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
