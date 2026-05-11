"use client";

import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";

export function BrokerMfaOtpInput({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      disabled={disabled}
      placeholder="000000"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      className={cn(
        "h-14 text-center font-mono text-2xl font-semibold tracking-[0.45em] sm:text-[1.65rem]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    />
  );
}
