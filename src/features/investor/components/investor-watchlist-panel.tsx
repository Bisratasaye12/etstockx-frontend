"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { WatchlistSection } from "@/features/profiles/components/watchlist-section";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function InvestorWatchlistPanel() {
  const t = useTranslations("investor.watchlist");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href="/market"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "rounded-full",
          )}
        >
          {t("browse")}
        </Link>
      </div>
      <WatchlistSection />
      <p className="text-muted-foreground text-sm">
        {t("manageHint")}{" "}
        <Link
          href="/profile/client"
          className={cn(buttonVariants({ variant: "link" }), "px-0")}
        >
          {t("profileLink")}
        </Link>
      </p>
    </div>
  );
}
