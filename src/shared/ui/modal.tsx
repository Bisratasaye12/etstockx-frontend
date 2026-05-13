"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  /** When true, clicking the backdrop closes the modal. Default true. */
  closeOnBackdrop?: boolean;
};

/**
 * Accessible modal shell: dark backdrop + centered container.
 * Compose content inside; use `onOpenChange(false)` from action buttons.
 */
export function Modal({
  open,
  onOpenChange,
  children,
  className,
  closeOnBackdrop = true,
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="bg-background/80 absolute inset-0 backdrop-blur-sm"
        onClick={() => {
          if (closeOnBackdrop) onOpenChange(false);
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "border-border bg-card text-card-foreground relative z-10 w-full max-w-md rounded-xl border p-6 shadow-lg ring-1 ring-foreground/10",
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
