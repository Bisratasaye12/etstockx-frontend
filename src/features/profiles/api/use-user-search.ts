import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  UserSearchPagedResult,
  UserSearchRole,
} from "@/shared/api/dtos/user-search";
import { profileKeys } from "./keys";

const MIN_QUERY_LENGTH = 2;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

type Params = {
  role: UserSearchRole;
  q: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
};

function normalizePaged(raw: UserSearchPagedResult): UserSearchPagedResult {
  const items = raw.items ?? [];
  const pageSize = raw.pageSize > 0 ? raw.pageSize : DEFAULT_PAGE_SIZE;
  const total = Number.isFinite(raw.total) ? raw.total : items.length;
  let totalPages = raw.totalPages;
  if (!Number.isFinite(totalPages) || totalPages < 0) {
    totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  }
  return {
    items,
    total,
    page: raw.page > 0 ? raw.page : 1,
    pageSize,
    totalPages,
  };
}

/**
 * GET /v1/profiles/users/search — clients or brokers by display name (min 2 chars).
 */
export function useUserSearch({
  role,
  q,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: Params) {
  const trimmed = q.trim();
  const canSearch = trimmed.length >= MIN_QUERY_LENGTH;
  const boundedPageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);

  return useQuery({
    queryKey: profileKeys.userSearch(role, trimmed, page, boundedPageSize),
    enabled: enabled && canSearch,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await browserApi.get<UserSearchPagedResult>(
        "/v1/profiles/users/search",
        {
          params: {
            role,
            q: trimmed,
            page,
            pageSize: boundedPageSize,
          },
        },
      );
      return normalizePaged(data);
    },
  });
}

export const USER_SEARCH_MIN_QUERY_LENGTH = MIN_QUERY_LENGTH;
