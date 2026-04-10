"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import type { RegisterPayload, UserRole } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Link } from "@/shared/i18n/routing";

export function RegisterForm() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("Client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLang, setPreferredLang] = useState("en");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [institution, setInstitution] = useState("");
  const [ecmaReference, setEcmaReference] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const body: RegisterPayload = {
        role,
        email,
        password,
        fullName,
        phone: phone || null,
        preferredLang,
        licenseNumber:
          role === "Broker" || role === "Dealer" ? licenseNumber : null,
        institution:
          role === "Broker" || role === "Dealer" ? institution || null : null,
        ecmaReference:
          role === "Broker" || role === "Dealer" ? ecmaReference || null : null,
      };
      await browserApi.post("/v1/auth/register", body);
      setMessage(t("registerSuccess"));
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax.response?.data?.error ?? "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="role">{t("role")}</Label>
        <select
          id="role"
          className="border-input bg-background h-8 w-full rounded-lg border px-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="Client">{t("roleClient")}</option>
          <option value="Broker">{t("roleBroker")}</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">{t("email")}</Label>
        <Input
          id="reg-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">{t("password")}</Label>
        <Input
          id="reg-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input
          id="fullName"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferredLang">{t("preferredLang")}</Label>
        <select
          id="preferredLang"
          className="border-input bg-background h-8 w-full rounded-lg border px-2 text-sm"
          value={preferredLang}
          onChange={(e) => setPreferredLang(e.target.value)}
        >
          <option value="en">English</option>
          <option value="am">አማርኛ</option>
        </select>
      </div>
      {(role === "Broker" || role === "Dealer") && (
        <>
          <div className="space-y-2">
            <Label htmlFor="license">{t("licenseNumber")}</Label>
            <Input
              id="license"
              required
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inst">{t("institution")}</Label>
            <Input
              id="inst"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ecma">{t("ecmaReference")}</Label>
            <Input
              id="ecma"
              value={ecmaReference}
              onChange={(e) => setEcmaReference(e.target.value)}
            />
          </div>
        </>
      )}
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "…" : t("registerButton")}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-primary font-medium underline">
          {tNav("signIn")}
        </Link>
      </p>
    </form>
  );
}
