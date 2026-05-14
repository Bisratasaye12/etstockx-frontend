"use client";

import { Check } from "lucide-react";

export function MfaLoginTwoStepStepper({
  labelStep1,
  labelStep2,
}: {
  labelStep1: string;
  labelStep2: string;
}) {
  return (
    <ol
      className="mb-8 flex items-center justify-center gap-2 sm:gap-4"
      aria-label="Sign-in progress"
    >
      <li className="flex items-center gap-2">
        <span
          className="border-primary bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
          aria-current="false"
        >
          <Check className="size-4" aria-hidden />
        </span>
        <span className="text-muted-foreground hidden max-w-[6.5rem] truncate text-xs font-medium sm:inline">
          {labelStep1}
        </span>
      </li>
      <span className="bg-primary/40 h-px w-8 sm:w-12" aria-hidden />
      <li className="flex items-center gap-2">
        <span
          className="border-primary bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
          aria-current="step"
        >
          2
        </span>
        <span className="text-foreground hidden max-w-[6.5rem] truncate text-xs font-semibold sm:inline">
          {labelStep2}
        </span>
      </li>
    </ol>
  );
}
