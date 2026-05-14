import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  BuyRequestDetailDto,
  SellRequestDetailDto,
} from "@/features/investor/model/types";
import { investorKeys } from "@/features/investor/api/keys";

export function useInvestorBuyRequestDetail(id: string, enabled: boolean) {
  return useQuery({
    queryKey: investorKeys.buyRequestDetail(id),
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const { data } = await browserApi.get<BuyRequestDetailDto>(
        `/v1/trade/buy-requests/${id}`,
      );
      return data;
    },
  });
}

export function useInvestorSellRequestDetail(id: string, enabled: boolean) {
  return useQuery({
    queryKey: investorKeys.sellRequestDetail(id),
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const { data } = await browserApi.get<SellRequestDetailDto>(
        `/v1/trade/sell-requests/${id}`,
      );
      return data;
    },
  });
}
