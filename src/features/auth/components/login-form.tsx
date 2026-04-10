"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/shared/i18n/routing";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function LoginForm() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        otpCode: otp.trim() ? otp.trim() : null,
        redirect: false,
      });
      if (res?.error) {
        setError(
          t("loginTitle") + " — check credentials, email verification, or MFA.",
        );
        return;
      }
      if (callbackUrl && callbackUrl.startsWith("/")) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="otp">{t("otp")}</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t("otpHint")}</p>
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "…" : t("signInButton")}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-primary font-medium underline">
          {tNav("register")}
        </Link>
      </p>
    </form>
  );
}
