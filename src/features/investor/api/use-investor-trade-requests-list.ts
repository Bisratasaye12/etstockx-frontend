import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  BuyRequestDto,
  SellRequestDto,
} from "@/features/investor/model/types";
import { investorKeys } from "@/features/investor/api/keys";
import {
  buyStatusQueryValue,
  sellStatusQueryValue,
} from "@/features/investor/lib/trade-request-status-query";
import type { TradeRequestStatusName } from "@/features/investor/lib/trade-request-status-query";

type Paged<T> = {
  items: T[] | null;
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZE = 100;

export type InvestorTradeListFilters = {
  instrument: string;
  status: TradeRequestStatusName | "";
  fromIso: string | undefined;
  toIso: string | undefined;
};

function filtersSignature(f: InvestorTradeListFilters): string {
  return JSON.stringify({
    i: f.instrument.trim(),
    s: f.status,
    from: f.fromIso ?? "",
    to: f.toIso ?? "",
  });
}

function buildParams(f: InvestorTradeListFilters, kind: "buy" | "sell") {
  const params: Record<string, string | number> = {
    page: 1,
    pageSize: PAGE_SIZE,
  };
  const ins = f.instrument.trim();
  if (ins) params.instrument = ins;
  if (f.fromIso) params.from = f.fromIso;
  if (f.toIso) params.to = f.toIso;
  const st =
    kind === "buy"
      ? buyStatusQueryValue(f.status)
      : sellStatusQueryValue(f.status);
  if (st !== undefined) params.status = st;
  return params;
}

export type InvestorTradeListRow =
  | ({ kind: "buy" } & BuyRequestDto)
  | ({ kind: "sell" } & SellRequestDto);

export function useInvestorTradeRequestsList(
  enabled: boolean,
  filters: InvestorTradeListFilters,
) {
  const sig = filtersSignature(filters);

  const [buyQ, sellQ] = useQueries({
    queries: [
      {
        queryKey: investorKeys.myRequestsBuy(sig),
        enabled,
        queryFn: async () => {
          const { data } = await browserApi.get<Paged<BuyRequestDto>>(
            "/v1/trade/buy-requests",
            { params: buildParams(filters, "buy") },
          );
          return data;
        },
      },
      {
        queryKey: investorKeys.myRequestsSell(sig),
        enabled,
        queryFn: async () => {
          const { data } = await browserApi.get<Paged<SellRequestDto>>(
            "/v1/trade/sell-requests",
            { params: buildParams(filters, "sell") },
          );
          return data;
        },
      },
    ],
  });

  const mergedRows = useMemo((): InvestorTradeListRow[] => {
    const buyItems = buyQ.data?.items ?? [];
    const sellItems = sellQ.data?.items ?? [];
    const rows: InvestorTradeListRow[] = [
      ...buyItems.map(
        (b): InvestorTradeListRow => ({
          kind: "buy",
          ...b,
        }),
      ),
      ...sellItems.map(
        (s): InvestorTradeListRow => ({
          kind: "sell",
          ...s,
        }),
      ),
    ];
    rows.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return rows;
  }, [buyQ.data?.items, sellQ.data?.items]);

  const buyTotal = buyQ.data?.total ?? 0;
  const sellTotal = sellQ.data?.total ?? 0;
  const pendingProposalCount = useMemo(() => {
    const b = buyQ.data?.items ?? [];
    const s = sellQ.data?.items ?? [];
    return [...b, ...s].filter((r) => r.status === "ProposalSent").length;
  }, [buyQ.data?.items, sellQ.data?.items]);

  const isLoading = buyQ.isLoading || sellQ.isLoading;
  const isError = buyQ.isError || sellQ.isError;
  const error = buyQ.error ?? sellQ.error;

  return {
    mergedRows,
    buyTotal,
    sellTotal,
    allTotal: buyTotal + sellTotal,
    pendingProposalCount,
    isLoading,
    isError,
    error,
    refetch: () => {
      void buyQ.refetch();
      void sellQ.refetch();
    },
  };
}
