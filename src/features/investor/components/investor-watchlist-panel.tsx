"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { InvestorWatchlistView } from "@/features/investor/components/investor-watchlist-view";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function InvestorWatchlistPanel() {
  const t = useTranslations("investor.watchlist");

  return (
    <div className="space-y-10">
      <InvestorWatchlistView />
      <footer className="text-muted-foreground flex flex-col gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          {t("manageHint")}{" "}
          <Link
            href="/profile/client"
            className={cn(
              buttonVariants({ variant: "link" }),
              "px-0 font-semibold",
            )}
          >
            {t("profileLink")}
          </Link>
        </p>
        <Link
          href="/market"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-10 shrink-0 self-start rounded-full px-6 font-semibold sm:self-auto",
          )}
        >
          {t("browse")}
        </Link>
      </footer>
    </div>
  );
}
