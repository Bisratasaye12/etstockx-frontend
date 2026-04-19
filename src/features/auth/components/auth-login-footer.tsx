"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";

export function AuthLoginFooter() {
  const t = useTranslations("auth");
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-background mt-auto shrink-0 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="#support"
            className="hover:text-foreground transition-colors"
          >
            {t("loginFooterSupport")}
          </Link>
          <Link
            href="#terms"
            className="hover:text-foreground transition-colors"
          >
            {t("loginFooterTerms")}
          </Link>
        </div>
        <p className="sm:text-right">{t("loginFooterCopyright", { year })}</p>
      </div>
    </footer>
  );
}
