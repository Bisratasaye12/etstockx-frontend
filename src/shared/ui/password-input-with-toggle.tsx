"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";

export type PasswordInputWithToggleProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
> & {
  showPasswordLabel: string;
  hidePasswordLabel: string;
};

export function PasswordInputWithToggle({
  className,
  showPasswordLabel,
  hidePasswordLabel,
  ...props
}: PasswordInputWithToggleProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hidePasswordLabel : showPasswordLabel}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
