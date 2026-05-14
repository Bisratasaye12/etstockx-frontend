import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  InvestorConversationDto,
  InvestorPagedResult,
} from "@/features/investor/model/messaging";
import { investorKeys } from "./keys";

export function useInvestorConversations(enabled: boolean) {
  return useQuery({
    queryKey: investorKeys.conversationsList(),
    enabled,
    queryFn: async () => {
      const { data } = await browserApi.get<
        InvestorPagedResult<InvestorConversationDto>
      >("/v1/messages/conversations", { params: { page: 1, pageSize: 50 } });
      return data.items ?? [];
    },
  });
}
