import { useInfiniteQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  InvestorMessageDto,
  InvestorPagedResult,
} from "@/features/investor/model/messaging";
import { investorKeys } from "./keys";

const PAGE_SIZE = 40;

export function useInvestorConversationMessages(
  conversationId: string,
  enabled: boolean,
) {
  return useInfiniteQuery({
    queryKey: investorKeys.conversationMessages(conversationId),
    enabled: enabled && Boolean(conversationId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await browserApi.get<
        InvestorPagedResult<InvestorMessageDto>
      >(`/v1/messages/conversations/${conversationId}/messages`, {
        params: { page: pageParam, pageSize: PAGE_SIZE },
      });
      return data;
    },
    getNextPageParam: (last) => {
      const p = last.page ?? 1;
      const tp = last.totalPages ?? 1;
      return p < tp ? p + 1 : undefined;
    },
  });
}

/** API returns newest first per page; merge pages into ascending `sentAt` for chat UI. */
export function mergeMessagePagesChronological(
  pages: InvestorPagedResult<InvestorMessageDto>[],
): InvestorMessageDto[] {
  return [...pages]
    .reverse()
    .flatMap((page) => [...(page.items ?? [])].reverse());
}
