"use client";

import { useMemo } from "react";
import { settlementBankOptionsForValue } from "@/config/settlement-banks";
import { cn } from "@/shared/lib/utils";

type SettlementBankSelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  required?: boolean;
};

export function SettlementBankSelect({
  id,
  value,
  onChange,
  placeholder,
  className,
  required,
}: SettlementBankSelectProps) {
  const options = useMemo(() => settlementBankOptionsForValue(value), [value]);

  return (
    <select
      id={id}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "border-input bg-background h-11 w-full rounded-lg border px-3 text-sm outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        className,
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((bank) => (
        <option key={bank} value={bank}>
          {bank}
        </option>
      ))}
    </select>
  );
}
