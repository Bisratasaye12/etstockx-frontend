import { useQueries, useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { BuyRequestDto } from "@/features/investor/model/types";
import { investorKeys } from "./keys";
import { fetchInvestorUnreadMessageCount } from "./fetch-unread-message-count";

type Paged<T> = {
  items: T[] | null;
  total: number;
  page: number;
  pageSize: number;
};

export function useInvestorDashboardData(isActivated: boolean) {
  const statsQueries = useQueries({
    queries: [
      {
        queryKey: investorKeys.buyRequestStats(),
        enabled: isActivated,
        queryFn: async () => {
          const { data } = await browserApi.get<Paged<unknown>>(
            "/v1/trade/buy-requests",
            { params: { page: 1, pageSize: 1 } },
          );
          return data.total;
        },
      },
      {
        queryKey: investorKeys.sellRequestStats(),
        enabled: isActivated,
        queryFn: async () => {
          const { data } = await browserApi.get<Paged<unknown>>(
            "/v1/trade/sell-requests",
            { params: { page: 1, pageSize: 1 } },
          );
          return data.total;
        },
      },
      {
        queryKey: investorKeys.conversationsUnread(),
        enabled: isActivated,
        queryFn: fetchInvestorUnreadMessageCount,
      },
    ],
  });

  const recentBuyRequests = useQuery({
    queryKey: investorKeys.recentBuyRequests(),
    enabled: isActivated,
    queryFn: async () => {
      const { data } = await browserApi.get<Paged<BuyRequestDto>>(
        "/v1/trade/buy-requests",
        { params: { page: 1, pageSize: 5 } },
      );
      return data.items ?? [];
    },
  });

  const [buyTotalQ, sellTotalQ, unreadQ] = statsQueries;

  return {
    activeRequestsTotal: (buyTotalQ.data ?? 0) + (sellTotalQ.data ?? 0),
    unreadMessages: unreadQ.data ?? 0,
    pendingDeals: 0,
    recentBuyRequests: recentBuyRequests.data ?? [],
    statsLoading: statsQueries.some((q) => q.isLoading),
    recentLoading: recentBuyRequests.isLoading,
  };
}
