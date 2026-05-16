"use client";

import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  FileQuestion,
  Home,
  Lock,
  LogIn,
  RefreshCw,
  ShieldX,
  ServerCrash,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import type { ErrorCode } from "@/features/errors/lib/error-codes";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";

type ScreenKey =
  | "notFound"
  | "unauthorized"
  | "forbidden"
  | "server"
  | "generic";

const SCREEN_KEY: Record<ErrorCode, ScreenKey> = {
  "404": "notFound",
  "401": "unauthorized",
  "403": "forbidden",
  "500": "server",
  generic: "generic",
};

const ICONS: Record<
  ErrorCode,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  "404": FileQuestion,
  "401": Lock,
  "403": ShieldX,
  "500": ServerCrash,
  generic: AlertTriangle,
};

const TONE_CLASS: Record<ErrorCode, string> = {
  "404": "bg-muted text-muted-foreground",
  "401": "bg-amber-500/12 text-amber-800 dark:text-amber-200",
  "403": "bg-orange-500/12 text-orange-800 dark:text-orange-200",
  "500": "bg-destructive/10 text-destructive",
  generic: "bg-muted text-muted-foreground",
};

type ErrorScreenProps = {
  code: ErrorCode;
  onRetry?: () => void;
  details?: string | null;
  className?: string;
};

export function ErrorScreen({
  code,
  onRetry,
  details,
  className,
}: ErrorScreenProps) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");
  const screenKey = SCREEN_KEY[code];
  const Icon = ICONS[code];

  const title = t(`screens.${screenKey}.title`);
  const description = t(`screens.${screenKey}.description`);

  let primary: ReactNode;
  let secondary: ReactNode | null = null;

  if (code === "401") {
    primary = (
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "gap-2",
        )}
      >
        <LogIn className="size-4" aria-hidden />
        {t("actions.signIn")}
      </Link>
    );
    secondary = (
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "gap-2",
        )}
      >
        <Home className="size-4" aria-hidden />
        {t("actions.goHome")}
      </Link>
    );
  } else if (code === "403") {
    primary = (
      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "gap-2",
        )}
      >
        <Home className="size-4" aria-hidden />
        {t("actions.goToDashboard")}
      </Link>
    );
    secondary = (
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
      >
        {t("actions.goHome")}
      </Link>
    );
  } else if (code === "404") {
    primary = (
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "gap-2",
        )}
      >
        <Home className="size-4" aria-hidden />
        {t("actions.goHome")}
      </Link>
    );
    secondary = (
      <Button
        variant="outline"
        size="lg"
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") window.history.back();
        }}
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("actions.goBack")}
      </Button>
    );
  } else if (code === "500" || code === "generic") {
    primary = onRetry ? (
      <Button type="button" size="lg" onClick={onRetry}>
        <RefreshCw className="size-4" aria-hidden />
        {t("actions.tryAgain")}
      </Button>
    ) : (
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "gap-2",
        )}
      >
        <Home className="size-4" aria-hidden />
        {t("actions.goHome")}
      </Link>
    );
    secondary = onRetry ? (
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
      >
        {t("actions.goHome")}
      </Link>
    ) : (
      <Button
        variant="outline"
        size="lg"
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") window.history.back();
        }}
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("actions.goBack")}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[min(100vh,720px)] flex-col items-center justify-center px-6 py-16",
        className,
      )}
    >
      <div className="border-border bg-card w-full max-w-lg space-y-8 rounded-2xl border p-8 text-center shadow-sm sm:p-10">
        <div className="flex flex-col items-center gap-6">
          <Link href="/" className="relative block h-9 w-[148px] shrink-0">
            <Image
              src="/EtStockX.svg"
              alt={tCommon("appName")}
              fill
              className="object-contain object-center"
              sizes="148px"
              unoptimized
              priority
            />
          </Link>

          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-2xl",
              TONE_CLASS[code],
            )}
          >
            <Icon className="size-8" aria-hidden />
          </div>

          <div className="space-y-2">
            <p className="text-primary text-5xl font-bold tracking-tight tabular-nums">
              {code === "generic" ? "!" : code}
            </p>
            <h1 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
              {description}
            </p>
          </div>

          {details?.trim() ? (
            <p className="text-muted-foreground border-border bg-muted/40 w-full rounded-lg border px-3 py-2 font-mono text-xs leading-relaxed break-all">
              {details.trim()}
            </p>
          ) : null}

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            {primary}
            {secondary}
          </div>
        </div>
      </div>
    </div>
  );
}
