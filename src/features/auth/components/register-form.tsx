"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Briefcase, Tag, UserRound } from "lucide-react";
import { useRouter } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import type {
  RegisterCreatedResponseDto,
  RegisterUserRequestDto,
  UserRole,
} from "@/shared/api/dtos/iam";
import { useAppDispatch } from "@/shared/store/hooks";
import {
  registrationFailed,
  registrationSubmitting,
  registrationSucceeded,
} from "@/features/auth/model/auth-slice";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { Separator } from "@/shared/ui/separator";
import { Link } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";

type SignupPersona = "investor" | "broker" | "seller";

function mapPersonaToRole(persona: SignupPersona): UserRole {
  if (persona === "broker") return "Broker";
  return "Client";
}

/** Mirrors RegisterUserCommandValidator: 8+ chars, upper, lower, digit, special. */
function passwordMeetsApiRules(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

const FULL_NAME_MAX = 255;

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();

  const [persona, setPersona] = useState<SignupPersona>("investor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [institution, setInstitution] = useState("");
  const [ecmaReference, setEcmaReference] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const role = useMemo(() => mapPersonaToRole(persona), [persona]);

  const passwordWeak = password.length > 0 && !passwordMeetsApiRules(password);
  const passwordMismatch =
    confirmPassword.length > 0 && confirmPassword !== password;

  const showWeakHint = touchedPassword && passwordWeak;
  const showMismatchHint = touchedConfirm && passwordMismatch;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTouchedPassword(true);
    setTouchedConfirm(true);

    if (!termsAccepted) {
      setError(t("termsRequired"));
      return;
    }
    const fullNameTrimmed = fullName.trim();
    if (!fullNameTrimmed) {
      setError(t("fullNameRequired"));
      return;
    }
    if (fullNameTrimmed.length > FULL_NAME_MAX) {
      setError(t("fullNameTooLong"));
      return;
    }

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setError(t("emailRequired"));
      return;
    }

    const preferredLang = locale === "am" ? "am" : "en";

    if (!passwordMeetsApiRules(password)) {
      setError(t("passwordRulesHint"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    let licenseForApi: string | null = null;
    if (role === "Broker" || role === "Dealer") {
      const trimmed = licenseNumber.trim();
      if (!trimmed) {
        setError(t("licenseRequired"));
        return;
      }
      licenseForApi = trimmed;
    }

    setPending(true);
    dispatch(registrationSubmitting());
    try {
      const body: RegisterUserRequestDto = {
        role,
        email: emailTrimmed,
        password,
        fullName: fullNameTrimmed,
        phone: phone.trim() ? phone.trim() : null,
        preferredLang,
        licenseNumber: licenseForApi,
        institution:
          role === "Broker" || role === "Dealer"
            ? institution.trim() || null
            : null,
        ecmaReference:
          role === "Broker" || role === "Dealer"
            ? ecmaReference.trim() || null
            : null,
      };
      const { data } = await browserApi.post<RegisterCreatedResponseDto>(
        "/v1/auth/register",
        body,
      );
      dispatch(
        registrationSucceeded({
          userId: data.userId,
          message: data.message,
        }),
      );
      router.push(`/verify-email?email=${encodeURIComponent(emailTrimmed)}`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      const msg = ax.response?.data?.error ?? "Registration failed";
      dispatch(registrationFailed(msg));
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  const roles: {
    id: SignupPersona;
    label: string;
    description: string;
    icon: typeof UserRound;
    badge?: "verification";
  }[] = [
    {
      id: "investor",
      label: t("roleInvestor"),
      description: t("roleInvestorDesc"),
      icon: UserRound,
    },
    {
      id: "broker",
      label: t("roleBrokerCard"),
      description: t("roleBrokerDesc"),
      icon: Briefcase,
      badge: "verification",
    },
    {
      id: "seller",
      label: t("roleSeller"),
      description: t("roleSellerDesc"),
      icon: Tag,
    },
  ];

  return (
    <div className="flex flex-1 flex-col px-6 py-10 md:px-12 lg:px-16">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-10"
        noValidate
      >
        <header className="space-y-2">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {t("registerFormHeading")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("registerFormSubheading")}
          </p>
        </header>

        <fieldset className="space-y-3">
          <legend className="sr-only">{t("role")}</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {roles.map(({ id, label, description, icon: Icon, badge }) => {
              const selected = persona === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPersona(id)}
                  className={cn(
                    "border-input bg-card text-card-foreground hover:border-primary/40 flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors",
                    selected && "border-primary ring-primary/25 ring-2",
                  )}
                >
                  <div className="relative w-full min-h-9">
                    <span className="bg-muted text-muted-foreground inline-flex size-9 items-center justify-center rounded-lg">
                      <Icon className="size-4 shrink-0" aria-hidden />
                    </span>
                    {badge === "verification" ? (
                      <Badge className="bg-brand-teal absolute -top-7 right-0 z-10 max-w-[min(100%,11rem)] border-0 text-right text-[0.65rem] leading-tight font-semibold tracking-wide whitespace-normal text-white uppercase">
                        {t("verificationRequired")}
                      </Badge>
                    ) : null}
                  </div>
                  <div>
                    <p className="font-heading text-sm font-semibold">
                      {label}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-snug">
                      {description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="space-y-2">
              <Label htmlFor="reg-fullName">
                {t("fullNameBilingualLabel")}
              </Label>
              <Input
                id="reg-fullName"
                name="fullName"
                required
                maxLength={FULL_NAME_MAX}
                autoComplete="name"
                placeholder={t("fullNamePlaceholder")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">{t("emailBilingualLabel")}</Label>
              <Input
                id="reg-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-phone">{t("phoneBilingualLabel")}</Label>
            <Input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+251 911 234 567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3">
            <p
              id="reg-password-rules"
              className="text-muted-foreground text-xs leading-relaxed"
            >
              {t("passwordRulesHint")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <div className="space-y-2">
                <Label htmlFor="reg-password">{t("password")}</Label>
                <Input
                  id="reg-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouchedPassword(true)}
                  aria-invalid={showWeakHint || undefined}
                  aria-describedby="reg-password-rules"
                />
                {showWeakHint ? (
                  <p
                    className="text-destructive flex items-start gap-1.5 text-sm"
                    role="alert"
                  >
                    <AlertCircle
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    {t("passwordRulesHint")}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">{t("confirmPassword")}</Label>
                <Input
                  id="reg-confirm"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouchedConfirm(true)}
                  aria-invalid={showMismatchHint || undefined}
                />
                {showMismatchHint ? (
                  <p
                    className="text-destructive flex items-start gap-1.5 text-sm"
                    role="alert"
                  >
                    <AlertCircle
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    {t("passwordMismatch")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {role === "Broker" ? (
          <div className="border-border bg-muted/30 flex flex-col gap-4 rounded-xl border p-4">
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
          </div>
        ) : null}

        <label className="flex cursor-pointer gap-3 text-sm leading-snug">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="border-input text-primary mt-0.5 size-4 shrink-0 rounded border"
          />
          <span className="text-muted-foreground">
            {t("termsAgree")}{" "}
            <Link
              href="#terms"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              {t("termsOfService")}
            </Link>{" "}
            {t("termsAnd")}{" "}
            <Link
              href="#privacy"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              {t("privacyPolicy")}
            </Link>
            .
          </span>
        </label>

        {error ? (
          <p
            className="text-destructive flex items-start gap-2 text-sm"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="h-11 w-full"
          disabled={pending}
        >
          {pending ? "…" : t("registerButton")}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="text-primary font-semibold underline-offset-4 hover:underline"
          >
            {tNav("signIn")}
          </Link>
        </p>
      </form>

      <footer className="mx-auto mt-auto flex w-full max-w-xl flex-col gap-6 pt-8">
        <Separator />
        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="#help"
              className="hover:text-foreground transition-colors"
            >
              {t("registerFooterHelp")}
            </Link>
            <Link
              href="#status"
              className="hover:text-foreground transition-colors"
            >
              {t("registerFooterStatus")}
            </Link>
          </div>
          <LocaleSwitcher />
        </div>
      </footer>
    </div>
  );
}
