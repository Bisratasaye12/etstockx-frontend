"use client";

import {
  BarChart3,
  Eye,
  Handshake,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { Link, useRouter } from "@/shared/i18n/routing";
import { useBrokerListingDetail } from "@/features/broker/api/use-broker-listing-detail";
import { useListingPerformance } from "@/features/broker/api/use-listing-performance";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

interface Props {
  listingId: string;
}

function formatRelativeDate(dateValue: string) {
  const date = new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.max(1, Math.floor(diffMs / dayMs));
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function asPercent(value: number) {
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

export function BrokerListingPerformancePage({ listingId }: Props) {
  const router = useRouter();
  const detail = useBrokerListingDetail(listingId);
  const perf = useListingPerformance(listingId);

  if (detail.isLoading || perf.isLoading) {
    return (
      <p className="text-muted-foreground text-sm">Loading performance...</p>
    );
  }

  if (detail.isError || perf.isError || !detail.data || !perf.data) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(detail.error ?? perf.error)}
      </p>
    );
  }

  const d = detail.data;
  const p = perf.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            <Link href="/dashboard/broker/listings" className="hover:underline">
              My Listings
            </Link>{" "}
            › {d.instrumentName ?? d.ticker ?? "Listing"} › Performance
          </p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">
            {d.instrumentName ?? d.ticker ?? "Listing"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Listing Performance Detail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/broker/listings")}
          >
            Back to My Listings
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/broker/listings/${listingId}/edit`)
            }
          >
            Edit Listing
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-4 md:grid-cols-5">
          <div>
            <p className="text-muted-foreground text-xs">Status</p>
            <p className="text-emerald-700 mt-1 text-sm font-semibold uppercase">
              {d.status ?? "Active"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Price</p>
            <p className="mt-1 text-lg font-semibold">
              ETB {d.price.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Quantity</p>
            <p className="mt-1 text-lg font-semibold">
              {d.quantity.toLocaleString("en-US")} shares
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Listed</p>
            <p className="mt-1 text-lg font-semibold">
              {formatRelativeDate(d.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date Range</p>
            <p className="mt-1 text-lg font-semibold">
              {(d.validFrom ?? "N/A").toString()} -{" "}
              {(d.validTo ?? "N/A").toString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
              <span>Views</span>
              <Eye className="size-4" />
            </div>
            <p className="text-4xl font-semibold">{p.views}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Total impressions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
              <span>Inquiries</span>
              <MessageSquare className="size-4" />
            </div>
            <p className="text-4xl font-semibold text-sky-700">{p.inquiries}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Active conversations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
              <span>Terms Agreed</span>
              <Handshake className="size-4" />
            </div>
            <p className="text-4xl font-semibold text-emerald-700">
              {p.termsAgreed}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Successful negotiations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
              <span>Conversion Rate</span>
              <TrendingUp className="size-4" />
            </div>
            <p className="text-4xl font-semibold text-emerald-700">
              {asPercent(p.conversionRate)}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Inquiries to Agreements
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-4">
          <h2 className="text-3xl font-medium">Conversion Funnel</h2>
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-slate-500" />
                <span className="font-medium">Views</span>
              </div>
              <span className="text-3xl font-semibold text-sky-700">
                {p.views}
              </span>
            </div>
            <div className="text-muted-foreground flex justify-center">↓</div>
            <div className="mx-auto flex w-[86%] items-center justify-between rounded-md border border-sky-200 bg-sky-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-sky-700" />
                <span className="font-medium">Inquiries</span>
              </div>
              <span className="text-3xl font-semibold text-sky-700">
                {p.inquiries}
              </span>
            </div>
            <div className="text-muted-foreground flex justify-center">↓</div>
            <div className="mx-auto flex w-[72%] items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-emerald-700" />
                <span className="font-medium">Terms Agreed</span>
              </div>
              <span className="text-3xl font-semibold text-emerald-700">
                {p.termsAgreed}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
