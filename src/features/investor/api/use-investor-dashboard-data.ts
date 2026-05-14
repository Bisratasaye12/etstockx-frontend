import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  BuyRequestDto,
  InvestorRequestRow,
  SellRequestDto,
} from "@/features/investor/model/types";
import {
  countActiveRequests,
  countCompleted,
  countInNegotiation,
  countTermsAgreed,
} from "@/features/investor/lib/trade-request-metrics";
import { investorKeys } from "./keys";

type Paged<T> = {
  items: T[] | null;
  total: number;
  page: number;
  pageSize: number;
};

const SNAPSHOT_PAGE_SIZE = 120;
const RECENT_PAGE_SIZE = 8;

function mergeRecentRequests(
  buyItems: BuyRequestDto[],
  sellItems: SellRequestDto[],
): InvestorRequestRow[] {
  const rows: InvestorRequestRow[] = [
    ...buyItems.map((b) => ({
      id: b.id,
      kind: "buy" as const,
      instrumentName: b.instrumentName,
      ticker: b.ticker,
      status: b.status,
      createdAt: b.createdAt,
    })),
    ...sellItems.map((s) => ({
      id: s.id,
      kind: "sell" as const,
      instrumentName: s.instrumentName,
      ticker: s.ticker,
      status: s.status,
      createdAt: s.createdAt,
    })),
  ];
  rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return rows.slice(0, 5);
}

export function useInvestorDashboardData(isActivated: boolean) {
  const [buySnapQ, sellSnapQ, buyRecentQ, sellRecentQ] = useQueries({
    queries: [
      {
        queryKey: investorKeys.tradeSnapshotBuy(),
        enabled: isActivated,
        queryFn: async () => {
          const { data } = await browserApi.get<Paged<BuyRequestDto>>(
            "/v1/trade/buy-requests",
            { params: { page: 1, pageSize: SNAPSHOT_PAGE_SIZE } },
          );
          return data;
        },
      },
      {
        queryKey: investorKeys.tradeSnapshotSell(),
        enabled: isActivated,
        queryFn: async () => {
          const { data } = await browserApi.get<Paged<SellRequestDto>>(
            "/v1/trade/sell-requests",
            { params: { page: 1, pageSize: SNAPSHOT_PAGE_SIZE } },
          );
          return data;
        },
      },
      {
        queryKey: investorKeys.recentBuyRequests(),
        enabled: isActivated,
        queryFn: async () => {
          const { data } = await browserApi.get<Paged<BuyRequestDto>>(
            "/v1/trade/buy-requests",
            { params: { page: 1, pageSize: RECENT_PAGE_SIZE } },
          );
          return data.items ?? [];
        },
      },
      {
        queryKey: investorKeys.recentSellRequests(),
        enabled: isActivated,
        queryFn: async () => {
          const { data } = await browserApi.get<Paged<SellRequestDto>>(
            "/v1/trade/sell-requests",
            { params: { page: 1, pageSize: RECENT_PAGE_SIZE } },
          );
          return data.items ?? [];
        },
      },
    ],
  });

  const metrics = useMemo(() => {
    const buyItems = buySnapQ.data?.items ?? [];
    const sellItems = sellSnapQ.data?.items ?? [];
    const buyStatuses = buyItems.map((b) => b.status);
    const sellStatuses = sellItems.map((s) => s.status);
    const allStatuses = [...buyStatuses, ...sellStatuses];

    const buyTotal = buySnapQ.data?.total ?? 0;
    const sellTotal = sellSnapQ.data?.total ?? 0;

    return {
      activeRequestsTotal: countActiveRequests(allStatuses),
      inNegotiationTotal: countInNegotiation(allStatuses),
      termsAgreedTotal: countTermsAgreed(allStatuses),
      completedTotal: countCompleted(allStatuses),
      snapshotTruncated:
        buyItems.length < buyTotal || sellItems.length < sellTotal,
    };
  }, [buySnapQ.data, sellSnapQ.data]);

  const recentRequests = useMemo(
    () => mergeRecentRequests(buyRecentQ.data ?? [], sellRecentQ.data ?? []),
    [buyRecentQ.data, sellRecentQ.data],
  );

  const statsLoading =
    buySnapQ.isLoading ||
    sellSnapQ.isLoading ||
    buyRecentQ.isLoading ||
    sellRecentQ.isLoading;

  const recentLoading = buyRecentQ.isLoading || sellRecentQ.isLoading;

  return {
    activeRequestsTotal: metrics.activeRequestsTotal,
    inNegotiationTotal: metrics.inNegotiationTotal,
    termsAgreedTotal: metrics.termsAgreedTotal,
    completedTotal: metrics.completedTotal,
    snapshotTruncated: metrics.snapshotTruncated,
    recentRequests,
    statsLoading,
    recentLoading,
  };
}
