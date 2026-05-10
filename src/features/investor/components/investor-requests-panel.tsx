"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import type { BuyRequestDto } from "@/features/investor/model/types";
import { investorKeys } from "@/features/investor/api/keys";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { getApiErrorMessage } from "@/shared/lib/api-error";

type Paged<T> = {
  items: T[] | null;
  total: number;
};

export function InvestorRequestsPanel() {
  const { data: session } = useSession();
  const t = useTranslations("investor.requests");
  const isActivated = Boolean(session?.user?.isActivated);

  const buyQuery = useQuery({
    queryKey: [...investorKeys.buyRequestStats(), "full-page"],
    enabled: isActivated,
    queryFn: async () => {
      const { data } = await browserApi.get<Paged<BuyRequestDto>>(
        "/v1/trade/buy-requests",
        { params: { page: 1, pageSize: 50 } },
      );
      return data.items ?? [];
    },
  });

  if (!isActivated) {
    return (
      <Card className="border-border/80 max-w-xl shadow-sm">
        <CardHeader>
          <CardTitle>{t("lockedTitle")}</CardTitle>
          <CardDescription>{t("lockedBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/profile/client"
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "rounded-full",
            )}
          >
            {t("completeProfile")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (buyQuery.isLoading) {
    return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  }

  if (buyQuery.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(buyQuery.error)}
      </p>
    );
  }

  const rows = buyQuery.data ?? [];

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
            buttonVariants({ variant: "default", size: "default" }),
            "rounded-full",
          )}
        >
          {t("newRequestCta")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="border-muted-foreground/25 bg-muted/15 flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-16 text-center">
          <ClipboardList
            className="text-muted-foreground size-10"
            aria-hidden
          />
          <p className="text-muted-foreground max-w-md text-sm">{t("empty")}</p>
          <Link
            href="/market"
            className={cn(
              buttonVariants({ variant: "default" }),
              "rounded-full",
            )}
          >
            {t("browseListings")}
          </Link>
        </div>
      ) : (
        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-border divide-y">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {row.instrumentName ?? row.ticker ?? t("unnamed")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {[
                        row.quantity != null
                          ? `${t("qty")}: ${row.quantity}`
                          : null,
                        row.desiredPrice != null
                          ? `${row.currency ?? ""} ${row.desiredPrice}`.trim()
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {row.status}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
