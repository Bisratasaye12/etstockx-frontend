"use client";

import { useLocale } from "next-intl";
import { signOut } from "next-auth/react";
import { Button } from "@/shared/ui/button";

export function SignOutButton({ label }: { label: string }) {
  const locale = useLocale();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-muted-foreground h-auto px-2 py-1"
      onClick={() => signOut({ callbackUrl: `/${locale}` })}
    >
      {label}
    </Button>
  );
}
