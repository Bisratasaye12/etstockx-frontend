import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { WatchlistItem } from "@/shared/api/types";
import { profileKeys } from "./keys";

export function useWatchlist(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: profileKeys.watchlist(),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data } = await browserApi.get<WatchlistItem[]>(
        "/v1/profiles/client/watchlist",
      );
      return data;
    },
  });
}
