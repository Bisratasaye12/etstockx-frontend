"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { useMarketSecurities } from "@/features/market/api/use-market-securities";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

export function SecuritiesCatalogView() {
  const t = useTranslations("investor.securities");
  const { status } = useSession();
  const [search, setSearch] = useState("");
  const query = useMarketSecurities(search, 1, 50, status === "authenticated");

  if (status === "loading") {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="border-border/80 bg-card mx-auto max-w-lg space-y-4 rounded-2xl border p-8 text-center">
        <p className="text-muted-foreground text-sm">{t("signInBody")}</p>
        <Link href="/login" className={cn(buttonVariants())}>
          {t("signInCta")}
        </Link>
      </div>
    );
  }

  const items = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("catalogTitle")}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("catalogSubtitle")}
        </p>
      </header>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="h-11 max-w-md"
      />

      {query.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
        </div>
      ) : (
        <ul className="divide-border border-border/80 bg-card divide-y rounded-2xl border shadow-sm">
          {items.map((s) => (
            <li key={s.id}>
              <Link
                href={`/market/securities/${s.id}`}
                className="hover:bg-muted/50 flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors"
              >
                <div>
                  <p className="font-mono text-sm font-semibold">{s.ticker}</p>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {s.sector ?? "—"} · {s.status}
                  </p>
                </div>
                {s.referencePrice != null ? (
                  <p className="text-sm font-semibold tabular-nums">
                    {s.referencePrice.toLocaleString()} {s.referenceCurrency}
                  </p>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    {t("noReferencePrice")}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 && !query.isLoading ? (
        <p className="text-muted-foreground text-sm">{t("emptyCatalog")}</p>
      ) : null}
    </div>
  );
}
