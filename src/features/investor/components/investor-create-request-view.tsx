"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Send, ShoppingCart, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import { investorKeys } from "@/features/investor/api/keys";
import { useBrokerDirectory } from "@/features/profiles/api/use-broker-directory";
import { useMarketSecurities } from "@/features/market/api/use-market-securities";
import { marketKeys } from "@/features/market/api/keys";
import type { ListingDetailDto } from "@/features/market/model/types";
import type { SecurityDto } from "@/features/market/model/security-types";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

type RequestKind = "buy" | "sell";

type CreateResponse = { id: string };

export function InvestorCreateRequestView() {
  const { data: session } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const t = useTranslations("investor.createRequest");
  const { data: brokers, isLoading: brokersLoading } = useBrokerDirectory();
  const searchParams = useSearchParams();
  const brokerIdFromUrl = searchParams.get("brokerId")?.trim() ?? "";
  const listingIdFromUrl = searchParams.get("listingId")?.trim() ?? "";

  const isActivated = Boolean(session?.user?.isActivated);

  const [kind, setKind] = useState<RequestKind>("buy");
  const [brokerId, setBrokerId] = useState("");
  const [securityId, setSecurityId] = useState("");
  const [securitySearch, setSecuritySearch] = useState("");
  const [instrumentName, setInstrumentName] = useState("");
  const [ticker, setTicker] = useState("");
  const [listingId, setListingId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [desiredPrice, setDesiredPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const listingPrefill = useQuery({
    queryKey: marketKeys.listingDetail(listingIdFromUrl),
    enabled: listingIdFromUrl.length > 0 && isActivated,
    queryFn: async () => {
      const { data } = await browserApi.get<ListingDetailDto>(
        `/v1/market/listings/${listingIdFromUrl}`,
      );
      return data;
    },
  });

  const listingLocked =
    listingIdFromUrl.length > 0 || listingId.trim().length > 0;

  const securities = useMarketSecurities(securitySearch, 1, 30, !listingLocked);

  const selectedSecurity = useMemo(
    () => securities.data?.items.find((s) => s.id === securityId) ?? null,
    [securityId, securities.data?.items],
  );

  const displayInstrumentName =
    instrumentName.trim() ||
    selectedSecurity?.name ||
    listingPrefill.data?.instrumentName?.trim() ||
    "";
  const displayTicker =
    ticker.trim() ||
    selectedSecurity?.ticker ||
    listingPrefill.data?.ticker?.trim() ||
    "";

  useEffect(() => {
    if (!brokerIdFromUrl) return;
    if (!brokers?.length) return;
    if (!brokers.some((b) => b.userId === brokerIdFromUrl)) return;
    setBrokerId(brokerIdFromUrl);
  }, [brokerIdFromUrl, brokers]);

  useEffect(() => {
    const listing = listingPrefill.data;
    if (!listing) return;
    setKind("buy");
    setListingId(listing.id);
    setBrokerId(listing.brokerId);
    setSecurityId(listing.securityId);
    setInstrumentName(listing.instrumentName?.trim() ?? "");
    setTicker(listing.ticker?.trim() ?? "");
    const label = [listing.ticker, listing.instrumentName]
      .filter(Boolean)
      .join(" — ");
    if (label) setSecuritySearch(label);
    if (listing.price > 0) setDesiredPrice(String(listing.price));
  }, [listingPrefill.data]);

  const selectSecurity = (security: SecurityDto) => {
    setSecurityId(security.id);
    setInstrumentName(security.name);
    setTicker(security.ticker);
    setSecuritySearch(`${security.ticker} — ${security.name}`);
    if (
      !listingLocked &&
      security.referencePrice != null &&
      security.referencePrice > 0
    ) {
      setDesiredPrice(String(security.referencePrice));
    }
  };

  const clearSecuritySelection = () => {
    if (listingLocked) return;
    setSecurityId("");
    setInstrumentName("");
    setTicker("");
    setSecuritySearch("");
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      setFieldError(null);
      const qty = Number.parseFloat(quantity.replace(/,/g, ""));
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error(t("errorQuantity"));
      }
      const priceRaw = desiredPrice.trim();
      const price =
        priceRaw === "" ? null : Number.parseFloat(priceRaw.replace(/,/g, ""));
      if (priceRaw !== "" && (!Number.isFinite(price) || (price ?? 0) <= 0)) {
        throw new Error(t("errorPrice"));
      }

      const resolvedInstrument =
        instrumentName.trim() || selectedSecurity?.name || "";
      const resolvedTicker = ticker.trim() || selectedSecurity?.ticker || null;

      if (kind === "buy") {
        const { data } = await browserApi.post<CreateResponse>(
          "/v1/trade/buy-requests",
          {
            brokerId,
            listingId: listingId.trim() || null,
            securityId: securityId.trim() || null,
            instrumentName: resolvedInstrument,
            ticker: resolvedTicker,
            quantity: qty,
            desiredPrice: price,
            currency: "ETB",
            notes: notes.trim() || null,
          },
        );
        return { kind: "buy" as const, id: data.id };
      }
      const { data } = await browserApi.post<CreateResponse>(
        "/v1/trade/sell-requests",
        {
          brokerId,
          securityId: securityId.trim(),
          instrumentName: resolvedInstrument,
          ticker: resolvedTicker,
          quantity: qty,
          desiredPrice: price,
          currency: "ETB",
          notes: notes.trim() || null,
        },
      );
      return { kind: "sell" as const, id: data.id };
    },
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: investorKeys.all });
      router.push(`/requests/${res.kind}/${res.id}`);
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) setFieldError(getApiErrorMessage(err));
      else if (err instanceof Error) setFieldError(err.message);
      else setFieldError(String(err));
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerId) {
      setFieldError(t("errorBroker"));
      return;
    }
    if (!securityId.trim()) {
      setFieldError(t("errorSecurity"));
      return;
    }
    createMutation.mutate();
  };

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
              "h-11 rounded-full px-8 font-semibold",
            )}
          >
            {t("completeProfile")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const submitOrange = kind === "sell";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <nav
        className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm"
        aria-label={t("breadcrumbAria")}
      >
        <Link
          href="/requests"
          className="text-primary font-medium hover:underline"
        >
          {t("breadcrumbParent")}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground font-medium">
          {t("breadcrumbCurrent")}
        </span>
      </nav>

      <header className="space-y-2">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("subtitle")}
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              if (listingLocked) return;
              setKind("buy");
              clearSecuritySelection();
            }}
            className={cn(
              "flex flex-col items-start gap-3 rounded-xl border-2 p-6 text-left transition-colors",
              kind === "buy"
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/30",
            )}
          >
            <ShoppingCart
              className={cn(
                "size-8",
                kind === "buy"
                  ? "text-primary-foreground"
                  : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "text-lg font-semibold",
                kind === "buy" ? "" : "text-foreground",
              )}
            >
              {t("buyCardTitle")}
            </span>
            <span
              className={cn(
                "text-sm leading-relaxed",
                kind === "buy" ? "text-primary-foreground/90" : "",
              )}
            >
              {t("buyCardDesc")}
            </span>
          </button>
          <button
            type="button"
            disabled={listingLocked}
            onClick={() => {
              if (listingLocked) return;
              setKind("sell");
              clearSecuritySelection();
            }}
            className={cn(
              "flex flex-col items-start gap-3 rounded-xl border-2 p-6 text-left transition-colors",
              kind === "sell"
                ? "border-amber-600 bg-amber-600 text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/30",
              listingLocked && "cursor-not-allowed opacity-50",
            )}
          >
            <Tag
              className={cn(
                "size-8",
                kind === "sell" ? "text-white" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "text-lg font-semibold",
                kind === "sell" ? "" : "text-foreground",
              )}
            >
              {t("sellCardTitle")}
            </span>
            <span
              className={cn(
                "text-sm leading-relaxed",
                kind === "sell" ? "text-white/90" : "",
              )}
            >
              {t("sellCardDesc")}
            </span>
          </button>
        </div>

        <Card className="border-border/80 rounded-xl border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              {t("section1Title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="broker">{t("brokerLabel")}</Label>
              <select
                id="broker"
                value={brokerId}
                onChange={(e) => setBrokerId(e.target.value)}
                disabled={brokersLoading}
                className="border-input bg-background text-foreground h-11 w-full rounded-lg border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
                required
              >
                <option value="">{t("brokerPlaceholder")}</option>
                {(brokers ?? []).map((b) => (
                  <option key={b.userId} value={b.userId}>
                    {b.institution?.trim() || b.fullName?.trim() || b.userId}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {listingId.trim() ? (
          <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-sm">
            {t("listingPrefillNote")}
          </p>
        ) : null}

        <Card className="border-border/80 rounded-xl border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              {t("section2Title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {listingLocked ? (
              <p className="text-muted-foreground text-xs">
                {t("selectedFromListing")}
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="securitySearch">{t("securityLabel")}</Label>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {kind === "sell"
                      ? t("securityHintSell")
                      : t("securityHintBuy")}
                  </p>
                </div>
                {!securityId ? (
                  <Input
                    id="securitySearch"
                    value={securitySearch}
                    onChange={(e) => setSecuritySearch(e.target.value)}
                    placeholder={t("securitySearchPlaceholder")}
                    className="h-11 rounded-lg"
                  />
                ) : null}
                {!securityId ? (
                  <ul className="border-border max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
                    {securities.isLoading ? (
                      <li className="text-muted-foreground px-3 py-2 text-sm">
                        …
                      </li>
                    ) : (securities.data?.items ?? []).length === 0 ? (
                      <li className="text-muted-foreground px-3 py-2 text-sm">
                        —
                      </li>
                    ) : (
                      (securities.data?.items ?? []).map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => selectSecurity(s)}
                            className="hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm"
                          >
                            <span className="font-mono">{s.ticker}</span>
                            <span className="text-muted-foreground mx-2">
                              —
                            </span>
                            {s.name}
                            {s.referencePrice != null ? (
                              <span className="text-muted-foreground ml-2 text-xs">
                                (ref. {s.referencePrice.toLocaleString()}{" "}
                                {s.referenceCurrency ?? "ETB"})
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}
              </div>
            )}

            {securityId && displayInstrumentName ? (
              <div className="border-border bg-muted/30 space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {t("selectedSecurityTitle")}
                  </p>
                  {!listingLocked ? (
                    <button
                      type="button"
                      onClick={clearSecuritySelection}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      {t("changeSecurity")}
                    </button>
                  ) : null}
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground text-xs font-medium uppercase">
                      {t("instrumentLabel")}
                    </dt>
                    <dd className="text-foreground mt-1 font-semibold">
                      {displayInstrumentName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs font-medium uppercase">
                      {t("tickerLabel")}
                    </dt>
                    <dd className="text-foreground mt-1 font-mono font-semibold">
                      {displayTicker || "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/80 rounded-xl border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              {t("section3Title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qty">{t("quantityLabel")}</Label>
                <Input
                  id="qty"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1000"
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">{t("priceLabel")}</Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  value={desiredPrice}
                  onChange={(e) => setDesiredPrice(e.target.value)}
                  placeholder={t("pricePlaceholder")}
                  className="h-11 rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t("notesLabel")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                className="min-h-[100px] rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {fieldError ? (
          <p className="text-destructive text-sm" role="alert">
            {fieldError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Link
            href="/requests"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "h-11 min-w-[100px] rounded-lg px-6 font-semibold",
            )}
          >
            {t("cancel")}
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-11 min-w-[180px] gap-2 rounded-lg px-6 font-semibold",
              submitOrange
                ? "border-amber-600 bg-amber-600 text-white hover:bg-amber-600/90 hover:text-white"
                : "",
            )}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            {t("submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
