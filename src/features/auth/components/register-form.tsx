"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Briefcase, Eye, EyeOff, UserRound } from "lucide-react";
import { useRouter } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import type {
  RegisterCreatedResponseDto,
  RegisterBrokerMultipartRequestDto,
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

type SignupPersona = "client" | "broker";

function RequiredStar() {
  return (
    <span className="ml-1 align-middle text-red-600" aria-hidden>
      *
    </span>
  );
}

function mapPersonaToRole(persona: SignupPersona): UserRole {
  if (persona === "broker") return "Broker";
  return "Client";
}

function extractDocumentType(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) return "unknown";
  return parts.at(-1)?.toLowerCase() ?? "unknown";
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
const MAX_BROKER_DOCUMENTS = 5;
const MAX_BROKER_DOCUMENTS_TOTAL_BYTES = 100 * 1024 * 1024;
const ALLOWED_BROKER_DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
]);

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();

  const [persona, setPersona] = useState<SignupPersona>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [institution, setInstitution] = useState("");
  const [ecmaReference, setEcmaReference] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      if (documents.length === 0) {
        setError("Please upload at least one verification document.");
        return;
      }
      if (documents.length > MAX_BROKER_DOCUMENTS) {
        setError(`You can upload up to ${MAX_BROKER_DOCUMENTS} documents.`);
        return;
      }
      const invalidFile = documents.find(
        (file) =>
          !ALLOWED_BROKER_DOCUMENT_EXTENSIONS.has(
            extractDocumentType(file.name),
          ),
      );
      if (invalidFile) {
        setError(
          `Document '${invalidFile.name}' must be a PDF, PNG, or JPEG file.`,
        );
        return;
      }
      const totalBytes = documents.reduce((sum, file) => sum + file.size, 0);
      if (totalBytes > MAX_BROKER_DOCUMENTS_TOTAL_BYTES) {
        setError("Total document size must be 100MB or less.");
        return;
      }
      licenseForApi = trimmed;
    }

    setPending(true);
    dispatch(registrationSubmitting());
    try {
      let data: RegisterCreatedResponseDto;
      if (role === "Broker" || role === "Dealer") {
        const brokerPayload: RegisterBrokerMultipartRequestDto = {
          Role: role,
          Email: emailTrimmed,
          Password: password,
          FullName: fullNameTrimmed,
          Phone: phone.trim(),
          PreferredLang: preferredLang,
          LicenseNumber: licenseForApi ?? "",
          Institution: institution.trim(),
          EcmaReference: ecmaReference.trim(),
          Documents: documents,
          DocumentTypes: documents.map((file) =>
            extractDocumentType(file.name),
          ),
        };
        const formData = new FormData();
        formData.append("Role", brokerPayload.Role);
        formData.append("Email", brokerPayload.Email);
        formData.append("Password", brokerPayload.Password);
        formData.append("FullName", brokerPayload.FullName);
        formData.append("Phone", brokerPayload.Phone);
        formData.append("PreferredLang", brokerPayload.PreferredLang);
        formData.append("LicenseNumber", brokerPayload.LicenseNumber);
        formData.append("Institution", brokerPayload.Institution);
        formData.append("EcmaReference", brokerPayload.EcmaReference);
        brokerPayload.Documents.forEach((file) => {
          formData.append("Documents", file);
        });
        (brokerPayload.DocumentTypes ?? []).forEach((documentType) => {
          formData.append("DocumentTypes", documentType);
        });

        const response = await browserApi.post<RegisterCreatedResponseDto>(
          "/v1/auth/register/broker",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        data = response.data;
      } else {
        const body: RegisterUserRequestDto = {
          role,
          email: emailTrimmed,
          password,
          fullName: fullNameTrimmed,
          phone: phone.trim() ? phone.trim() : null,
          preferredLang,
          licenseNumber: null,
          institution: null,
          ecmaReference: null,
        };
        const response = await browserApi.post<RegisterCreatedResponseDto>(
          "/v1/auth/register",
          body,
        );
        data = response.data;
      }
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
      id: "client",
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
  ];

  return (
    <div className="flex flex-1 flex-col px-6 py-10 md:px-12 lg:px-16">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10"
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
          <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-9">
            <div className="space-y-2">
              <Label htmlFor="reg-fullName">
                {t("fullNameBilingualLabel")}
                <RequiredStar />
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
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">
                {t("emailBilingualLabel")}
                <RequiredStar />
              </Label>
              <Input
                id="reg-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
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
              className="h-10"
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
                <Label htmlFor="reg-password">
                  {t("password")}
                  <RequiredStar />
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouchedPassword(true)}
                    aria-invalid={showWeakHint || undefined}
                    aria-describedby="reg-password-rules"
                    className="h-10 pr-11"
                  />
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? t("loginHidePassword")
                        : t("loginShowPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
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
                <Label htmlFor="reg-confirm">
                  {t("confirmPassword")}
                  <RequiredStar />
                </Label>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setTouchedConfirm(true)}
                    aria-invalid={showMismatchHint || undefined}
                    className="h-10 pr-11"
                  />
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword
                        ? t("loginHidePassword")
                        : t("loginShowPassword")
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
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
              <Label htmlFor="license">
                {t("licenseNumber")}
                <RequiredStar />
              </Label>
              <Input
                id="license"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broker-documents">
                Verification documents
                <RequiredStar />
              </Label>
              <Input
                id="broker-documents"
                type="file"
                multiple
                required
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? []);
                  if (selected.length > MAX_BROKER_DOCUMENTS) {
                    setError(
                      `You can upload up to ${MAX_BROKER_DOCUMENTS} documents.`,
                    );
                    setDocuments(selected.slice(0, MAX_BROKER_DOCUMENTS));
                    return;
                  }
                  const invalidFile = selected.find(
                    (file) =>
                      !ALLOWED_BROKER_DOCUMENT_EXTENSIONS.has(
                        extractDocumentType(file.name),
                      ),
                  );
                  if (invalidFile) {
                    setError(
                      `Document '${invalidFile.name}' must be a PDF, PNG, or JPEG file.`,
                    );
                    setDocuments([]);
                    return;
                  }
                  const totalBytes = selected.reduce(
                    (sum, file) => sum + file.size,
                    0,
                  );
                  if (totalBytes > MAX_BROKER_DOCUMENTS_TOTAL_BYTES) {
                    setError("Total document size must be 100MB or less.");
                    setDocuments([]);
                    return;
                  }
                  setError(null);
                  setDocuments(selected);
                }}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst">{t("institution")}</Label>
              <Input
                id="inst"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecma">{t("ecmaReference")}</Label>
              <Input
                id="ecma"
                value={ecmaReference}
                onChange={(e) => setEcmaReference(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        ) : null}

        <label className="flex cursor-pointer gap-3 text-sm leading-snug">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
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
