"use client";

import { useLocale } from "next-intl";
import { useAppLogout } from "@/features/auth/hooks/use-app-logout";
import { Button } from "@/shared/ui/button";

export function SignOutButton({ label }: { label: string }) {
  const locale = useLocale();
  const { logout, pending } = useAppLogout();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-muted-foreground h-auto px-2 py-1"
      disabled={pending}
      onClick={() => void logout(`/${locale}`)}
    >
      {label}
    </Button>
  );
}
