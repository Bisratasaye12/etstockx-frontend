"use client";

import type { ReactNode } from "react";

type AdminPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AdminPageShell({
  title,
  subtitle,
  children,
}: AdminPageShellProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
