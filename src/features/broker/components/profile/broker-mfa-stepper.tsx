"use client";

import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type Step = 1 | 2 | 3;

const steps: Step[] = [1, 2, 3];

export function BrokerMfaStepper({
  current,
  labelVerify,
  labelSetup,
  labelFinalize,
}: {
  current: Step;
  labelVerify: string;
  labelSetup: string;
  labelFinalize: string;
}) {
  const labels: Record<Step, string> = {
    1: labelVerify,
    2: labelSetup,
    3: labelFinalize,
  };

  return (
    <ol
      className="flex flex-wrap items-center justify-end gap-2 sm:gap-4"
      aria-label="MFA setup progress"
    >
      {steps.map((step, idx) => {
        const done = current > step;
        const active = current === step;
        return (
          <li key={step} className="flex items-center gap-2 sm:gap-4">
            {idx > 0 ? (
              <span
                className={cn(
                  "hidden h-px w-6 sm:block sm:w-10",
                  done || active ? "bg-primary/50" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active &&
                    !done &&
                    "border-primary bg-primary/10 text-primary",
                  !done &&
                    !active &&
                    "border-border bg-muted/50 text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : step}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline sm:max-w-[7rem] sm:truncate",
                  active && "text-foreground",
                  !active && "text-muted-foreground",
                )}
              >
                {labels[step]}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
