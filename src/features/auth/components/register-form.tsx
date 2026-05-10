"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import type {
  RegisterBrokerMultipartRequestDto,
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

function getClientRole(): "Client" {
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
/** Per-file ceiling for broker uploads — aligned with product UI (10&nbsp;MB each). */
const MAX_BROKER_FILE_BYTES_PER_FILE = 10 * 1024 * 1024;
const ALLOWED_BROKER_DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
]);

function formatReadableFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb < 100 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

type RegisterStep = "role" | "details";

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<RegisterStep>("role");
  const [persona, setPersona] = useState<SignupPersona | null>(null);
  const [roleStepError, setRoleStepError] = useState(false);

  const [preferredLangPref, setPreferredLangPref] = useState<"en" | "am">(
    locale === "am" ? "am" : "en",
  );

  const [brokerApiRole, setBrokerApiRole] = useState<"Broker" | "Dealer">(
    "Broker",
  );
  const brokerFileInputRef = useRef<HTMLInputElement>(null);
  const [brokerDropHighlight, setBrokerDropHighlight] = useState(false);

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

  const passwordWeak = password.length > 0 && !passwordMeetsApiRules(password);
  const passwordMismatch =
    confirmPassword.length > 0 && confirmPassword !== password;

  const showWeakHint = touchedPassword && passwordWeak;
  const showMismatchHint = touchedConfirm && passwordMismatch;

  function goToDetails() {
    setError(null);
    if (persona === null) {
      setRoleStepError(true);
      return;
    }
    setRoleStepError(false);
    setPreferredLangPref(locale === "am" ? "am" : "en");
    if (persona === "broker") {
      setBrokerApiRole("Broker");
    }
    setStep("details");
  }

  function backToRole() {
    setStep("role");
    setError(null);
  }

  function ingestBrokerDocuments(incoming: readonly File[]): void {
    setError(null);
    if (!incoming.length) return;

    let nextDocs = [...documents];

    for (const file of incoming) {
      if (nextDocs.length >= MAX_BROKER_DOCUMENTS) {
        setError(t("registerBrokerTooManyDocs", { max: MAX_BROKER_DOCUMENTS }));
        return;
      }
      const ext = extractDocumentType(file.name);
      if (!ALLOWED_BROKER_DOCUMENT_EXTENSIONS.has(ext)) {
        setError(t("registerBrokerInvalidDoc"));
        return;
      }
      if (file.size > MAX_BROKER_FILE_BYTES_PER_FILE) {
        setError(t("registerBrokerFileTooLarge"));
        return;
      }
      nextDocs = [...nextDocs, file];
    }

    const totalBytes = nextDocs.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_BROKER_DOCUMENTS_TOTAL_BYTES) {
      setError(t("registerBrokerTotalSizeExceeded"));
      return;
    }

    setDocuments(nextDocs);
  }

  function resolveBrokerBadgeLabel(file: File): string {
    const n = file.name.toLowerCase();
    if (n.includes("license")) return t("registerBrokerBadgeBusinessLicense");
    return t("registerBrokerBadgeSupporting");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!persona) return;

    setError(null);
    setTouchedPassword(true);
    setTouchedConfirm(true);

    if (persona !== "broker" && !termsAccepted) {
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

    const preferredLang = preferredLangPref;
    const roleResolved: UserRole =
      persona === "broker" ? brokerApiRole : getClientRole();

    if (!passwordMeetsApiRules(password)) {
      setError(t("passwordRulesHint"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    let licenseForApi: string | null = null;
    if (roleResolved === "Broker" || roleResolved === "Dealer") {
      const trimmed = licenseNumber.trim();
      if (!trimmed) {
        setError(t("licenseRequired"));
        return;
      }
      if (documents.length === 0) {
        setError(t("registerBrokerDocRequired"));
        return;
      }
      const invalidFile = documents.find(
        (file) =>
          !ALLOWED_BROKER_DOCUMENT_EXTENSIONS.has(
            extractDocumentType(file.name),
          ),
      );
      if (invalidFile) {
        setError(t("registerBrokerInvalidDoc"));
        return;
      }
      const tooLargeEach = documents.find(
        (f) => f.size > MAX_BROKER_FILE_BYTES_PER_FILE,
      );
      if (tooLargeEach) {
        setError(t("registerBrokerFileTooLarge"));
        return;
      }
      const totalBytes = documents.reduce((sum, file) => sum + file.size, 0);
      if (totalBytes > MAX_BROKER_DOCUMENTS_TOTAL_BYTES) {
        setError(t("registerBrokerTotalSizeExceeded"));
        return;
      }
      licenseForApi = trimmed;
    }

    setPending(true);
    dispatch(registrationSubmitting());
    try {
      let data: RegisterCreatedResponseDto;
      if (roleResolved === "Broker" || roleResolved === "Dealer") {
        const brokerPayload: RegisterBrokerMultipartRequestDto = {
          Role: roleResolved,
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
        );
        data = response.data;
      } else {
        const body: RegisterUserRequestDto = {
          role: roleResolved,
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
      const roleForVerify =
        roleResolved === "Broker" || roleResolved === "Dealer"
          ? `&role=${encodeURIComponent(roleResolved)}`
          : "";
      router.push(
        `/verify-email?email=${encodeURIComponent(emailTrimmed)}&registered=1${roleForVerify}`,
      );
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      const msg = ax.response?.data?.error ?? "Registration failed";
      dispatch(registrationFailed(msg));
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  const roleOptions: {
    id: SignupPersona;
    label: string;
    description: string;
  }[] = [
    {
      id: "client",
      label: t("roleInvestor"),
      description: t("roleInvestorDesc"),
    },
    {
      id: "broker",
      label: t("roleBrokerCard"),
      description: t("roleBrokerDesc"),
    },
  ];

  const cardShell =
    "border-border bg-card text-card-foreground w-full max-w-md rounded-xl border shadow-lg shadow-black/5";

  const brokerSectionTitle =
    "text-primary font-heading border-primary/25 border-b pb-3 text-[11px] font-semibold uppercase tracking-[0.14em]";
  const brokerFieldLabel =
    "text-muted-foreground text-xs font-semibold uppercase tracking-wide";
  const brokerSelectClass =
    "border-input bg-background text-foreground h-11 w-full rounded-md border px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

  return (
    <div className="flex flex-1 flex-col px-6 py-10 md:px-12 lg:px-16">
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col gap-8",
          step === "details" && persona === "broker" ? "max-w-3xl" : "max-w-md",
        )}
      >
        {step === "role" ? (
          <div className={cn(cardShell, "flex flex-col gap-8 p-8 md:p-9")}>
            <header className="space-y-2 text-center">
              <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight">
                {t("registerAccountCardTitle")}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("registerRoleSelectionSub")}
              </p>
            </header>

            <fieldset className="space-y-4">
              <legend className="sr-only">{t("role")}</legend>
              <div className="flex flex-col gap-3">
                {roleOptions.map(({ id, label, description }) => {
                  const selected = persona === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setPersona(id);
                        setRoleStepError(false);
                      }}
                      className={cn(
                        "hover:border-primary/35 flex w-full gap-4 rounded-xl border-2 bg-transparent p-4 text-left transition-colors",
                        selected
                          ? "border-primary ring-primary/20 ring-[3px]"
                          : "border-input",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-[1.125rem] shrink-0 items-center justify-center rounded-full border-2",
                          selected
                            ? "border-primary"
                            : "border-muted-foreground/50",
                        )}
                        aria-hidden
                      >
                        {selected ? (
                          <span className="bg-primary size-2.5 shrink-0 rounded-full" />
                        ) : null}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="font-heading block text-md font-semibold">
                          {label}
                        </span>
                        <span className="text-muted-foreground mt-1 block text-xs leading-snug">
                          {description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-4">
              {roleStepError ? (
                <div
                  className="border-destructive/35 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t("registerRoleRequired")}
                </div>
              ) : null}

              <Button
                type="button"
                size="lg"
                className="h-11 w-full"
                onClick={goToDetails}
              >
                {t("registerContinueToForm")}
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
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className={cn(
              "flex w-full flex-col",
              persona === "broker" ? "gap-10" : "gap-8",
            )}
            noValidate
          >
            {persona === "broker" ? (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    onClick={backToRole}
                    className="text-foreground hover:text-primary inline-flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <ArrowLeft className="size-4 shrink-0" aria-hidden />
                    {t("registerBrokerBackRole")}
                  </button>
                  <p className="text-muted-foreground text-sm sm:text-right">
                    {t("hasAccount")}{" "}
                    <Link
                      href="/login"
                      className="text-primary font-semibold underline-offset-4 hover:underline"
                    >
                      {tNav("signIn")}
                    </Link>
                  </p>
                </div>

                <header className="space-y-2">
                  <h2 className="font-heading text-foreground text-3xl font-bold tracking-tight">
                    {t("registerBrokerProfessionalTitle")}
                  </h2>
                  <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                    {t("registerBrokerProfessionalSubtitle")}
                  </p>
                </header>

                <div className="border-border bg-card flex flex-col gap-10 rounded-2xl border p-6 shadow-sm md:p-8 lg:p-10">
                  {error ? (
                    <div
                      className="border-destructive/35 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm"
                      role="alert"
                    >
                      <AlertCircle
                        className="mt-0.5 size-4 shrink-0"
                        aria-hidden
                      />
                      {error}
                    </div>
                  ) : null}

                  <section className="space-y-6">
                    <h3 className={brokerSectionTitle}>
                      {t("registerBrokerSectionPersonal")}
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="reg-broker-role"
                          className={brokerFieldLabel}
                        >
                          {t("role")}
                          <RequiredStar />
                        </Label>
                        <select
                          id="reg-broker-role"
                          value={brokerApiRole}
                          onChange={(e) =>
                            setBrokerApiRole(
                              e.target.value as "Broker" | "Dealer",
                            )
                          }
                          className={brokerSelectClass}
                          required
                        >
                          <option value="Broker">{t("roleBroker")}</option>
                          <option value="Dealer">{t("roleDealer")}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="reg-broker-pref-lang"
                          className={brokerFieldLabel}
                        >
                          {t("preferredLang")}
                          <RequiredStar />
                        </Label>
                        <select
                          id="reg-broker-pref-lang"
                          value={preferredLangPref}
                          onChange={(e) =>
                            setPreferredLangPref(e.target.value as "en" | "am")
                          }
                          className={brokerSelectClass}
                        >
                          <option value="en">{t("prefLangOptionEn")}</option>
                          <option value="am">{t("prefLangOptionAm")}</option>
                        </select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label
                          htmlFor="reg-fullName"
                          className={brokerFieldLabel}
                        >
                          {t("registerBrokerLabelFullName")}
                          <RequiredStar />
                        </Label>
                        <Input
                          id="reg-fullName"
                          name="fullName"
                          required
                          maxLength={FULL_NAME_MAX}
                          autoComplete="name"
                          placeholder={t(
                            "registerBrokerPlaceholderFullLegalName",
                          )}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email" className={brokerFieldLabel}>
                          {t("email")}
                          <RequiredStar />
                        </Label>
                        <Input
                          id="reg-email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder={t("registerBrokerPlaceholderEmail")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-phone" className={brokerFieldLabel}>
                          {t("phone")}
                        </Label>
                        <Input
                          id="reg-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder={t("registerBrokerPlaceholderPhone")}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className={brokerSectionTitle}>
                      {t("registerBrokerSectionSecurity")}
                    </h3>
                    <div className="space-y-2">
                      <Label
                        htmlFor="reg-password"
                        className={brokerFieldLabel}
                      >
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
                          aria-describedby="reg-password-rules-broker"
                          className="h-11 pr-11"
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
                      <p
                        id="reg-password-rules-broker"
                        className="text-muted-foreground text-xs leading-relaxed"
                      >
                        {t("registerPasswordRulesClient")}
                      </p>
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
                      <Label htmlFor="reg-confirm" className={brokerFieldLabel}>
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
                          className="h-11 pr-11"
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
                  </section>

                  <section className="space-y-6">
                    <h3 className={brokerSectionTitle}>
                      {t("registerBrokerSectionCredentials")}
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="inst" className={brokerFieldLabel}>
                        {t("institution")}
                      </Label>
                      <Input
                        id="inst"
                        placeholder={t("registerBrokerPlaceholderInstitution")}
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="license" className={brokerFieldLabel}>
                          {t("licenseNumber")}
                          <RequiredStar />
                        </Label>
                        <Input
                          id="license"
                          required
                          placeholder={t("registerBrokerPlaceholderLicense")}
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ecma" className={brokerFieldLabel}>
                          {t("ecmaReference")}
                        </Label>
                        <Input
                          id="ecma"
                          placeholder={t("registerBrokerPlaceholderEcma")}
                          value={ecmaReference}
                          onChange={(e) => setEcmaReference(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className={brokerSectionTitle}>
                      {t("registerBrokerSectionDocuments")}
                    </h3>
                    <div
                      role="presentation"
                      tabIndex={0}
                      onClick={() => brokerFileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          brokerFileInputRef.current?.click();
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setBrokerDropHighlight(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setBrokerDropHighlight(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setBrokerDropHighlight(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setBrokerDropHighlight(false);
                        ingestBrokerDocuments(Array.from(e.dataTransfer.files));
                      }}
                      className={cn(
                        "cursor-pointer rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        brokerDropHighlight
                          ? "border-primary bg-primary/5"
                          : "border-input bg-muted/25 hover:border-primary/40 hover:bg-muted/35",
                      )}
                    >
                      <input
                        ref={brokerFileInputRef}
                        id="broker-documents"
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="sr-only"
                        onChange={(e) => {
                          ingestBrokerDocuments(
                            Array.from(e.target.files ?? []),
                          );
                          e.target.value = "";
                        }}
                      />
                      <UploadCloud
                        className="text-muted-foreground mx-auto mb-4 size-10"
                        aria-hidden
                      />
                      <p className="font-heading text-foreground text-sm font-semibold">
                        {t("registerBrokerDropzoneTitle")}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                        {t("registerBrokerDropzoneHint")}
                      </p>
                    </div>
                    {documents.length > 0 ? (
                      <ul className="flex flex-col gap-3">
                        {documents.map((file, idx) => (
                          <li
                            key={`${file.name}-${idx}-${file.lastModified}`}
                            className="border-border bg-muted/20 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm"
                          >
                            <FileText
                              className="text-muted-foreground size-8 shrink-0"
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="truncate font-medium">
                                {file.name}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {formatReadableFileSize(file.size)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-muted-foreground shrink-0 font-normal"
                            >
                              {resolveBrokerBadgeLabel(file)}
                            </Badge>
                            <button
                              type="button"
                              className="text-destructive hover:bg-destructive/10 ml-auto inline-flex size-9 items-center justify-center rounded-md transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDocuments((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                );
                              }}
                              aria-label={t("registerBrokerRemoveFile")}
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>

                  <div className="flex flex-col gap-5 pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full gap-2 text-base font-semibold"
                      disabled={pending}
                    >
                      {pending ? (
                        <>
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden
                          />
                          {t("registerBrokerSubmitting")}
                        </>
                      ) : (
                        <>
                          {t("registerBrokerSubmitApplication")}
                          <ChevronRight
                            className="size-4 shrink-0"
                            aria-hidden
                          />
                        </>
                      )}
                    </Button>
                    <p className="text-muted-foreground text-center text-sm leading-relaxed">
                      {t("registerBrokerLegalLead")}{" "}
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
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className={cn(cardShell, "flex flex-col gap-8 p-8 md:p-9")}>
                <header className="space-y-2 text-center">
                  <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight">
                    {t("registerClientFormTitle")}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t("registerClientFormSubtitle")}
                  </p>
                </header>

                {error ? (
                  <div
                    className="border-destructive/35 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm"
                    role="alert"
                  >
                    <AlertCircle
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="reg-fullName">
                      {t("registerClientFullNameLabel")}
                      <RequiredStar />
                    </Label>
                    <Input
                      id="reg-fullName"
                      name="fullName"
                      required
                      maxLength={FULL_NAME_MAX}
                      autoComplete="name"
                      placeholder={t("registerClientFullNamePlaceholder")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">
                      {t("registerClientEmailLabel")}
                      <RequiredStar />
                    </Label>
                    <Input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={t("registerClientEmailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">
                      {t("registerClientPhoneLabel")}
                    </Label>
                    <Input
                      id="reg-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder={t("registerClientPhonePlaceholder")}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-pref-lang">{t("preferredLang")}</Label>
                    <select
                      id="reg-pref-lang"
                      value={preferredLangPref}
                      onChange={(e) =>
                        setPreferredLangPref(e.target.value as "en" | "am")
                      }
                      className={cn(
                        "border-input bg-background h-10 w-full rounded-md border px-2.5 text-sm transition-colors outline-none",
                        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        "disabled:opacity-50",
                      )}
                    >
                      <option value="en">{t("prefLangOptionEn")}</option>
                      <option value="am">{t("prefLangOptionAm")}</option>
                    </select>
                  </div>

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
                        placeholder={t("registerClientPasswordPlaceholder")}
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
                  </div>

                  <p
                    id="reg-password-rules"
                    className="text-muted-foreground text-xs leading-relaxed"
                  >
                    {t("registerPasswordRulesClient")}
                  </p>

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

                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full gap-2"
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      <span>{t("registerSubmitting")}</span>
                    </>
                  ) : (
                    t("registerButton")
                  )}
                </Button>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={backToRole}
                    className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                  >
                    {t("registerBack")}
                  </button>
                </div>

                <p className="text-muted-foreground text-center text-sm">
                  {t("hasAccount")}{" "}
                  <Link
                    href="/login"
                    className="text-primary font-semibold underline-offset-4 hover:underline"
                  >
                    {tNav("signIn")}
                  </Link>
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
