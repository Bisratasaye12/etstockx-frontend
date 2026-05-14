"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import type { BrokerDirectoryEntry } from "@/shared/api/types";
import {
  institutionInitials,
  personInitials,
} from "@/features/brokers/lib/filter-brokers";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

type Props = {
  broker: BrokerDirectoryEntry;
};

export function BrokerDirectoryCard({ broker }: Props) {
  const t = useTranslations("investor.brokers");
  const fullName = broker.fullName?.trim();
  const institution = broker.institution?.trim();
  const displayName = fullName || institution || t("unnamedBroker");
  const initials = fullName
    ? personInitials(fullName)
    : institutionInitials(broker.institution);
  const tags = (broker.specializations ?? []).slice(0, 3);
  const bioPreview = broker.bio?.trim() ?? "";

  return (
    <article className="border-border/80 bg-card flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="bg-primary/12 text-primary flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold">
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className="text-foreground truncate text-lg font-bold tracking-tight">
              {displayName}
            </h3>
            {fullName && institution ? (
              <p className="text-muted-foreground truncate text-sm">
                {institution}
              </p>
            ) : null}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
            broker.isAcceptingRequests
              ? "bg-emerald-500/12 text-emerald-800 dark:text-emerald-200"
              : "bg-muted text-muted-foreground",
          )}
        >
          {broker.isAcceptingRequests ? t("statusOpen") : t("statusClosed")}
        </span>
      </div>

      <div className="min-h-0 flex-1 px-5 pt-4 pb-4">
        {bioPreview ? (
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {bioPreview}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm italic">{t("noBio")}</p>
        )}
        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="border-border text-muted-foreground rounded-md border px-2 py-0.5 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-border mt-auto flex items-center justify-between gap-3 border-t px-5 py-4">
        <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
          <Shield className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate font-mono">
            {broker.licenseDisplay?.trim() || "—"}
          </span>
        </div>
        <Link
          href={`/brokers/${broker.userId}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "shrink-0 rounded-lg px-3 text-xs font-medium",
          )}
        >
          {t("viewProfile")}
        </Link>
      </div>
    </article>
  );
}
