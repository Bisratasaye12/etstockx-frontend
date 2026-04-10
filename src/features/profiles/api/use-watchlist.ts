import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { WatchlistItem } from "@/shared/api/types";
import { profileKeys } from "./keys";

export function useWatchlist() {
  return useQuery({
    queryKey: profileKeys.watchlist(),
    queryFn: async () => {
      const { data } = await browserApi.get<WatchlistItem[]>(
        "/v1/profiles/client/watchlist",
      );
      return data;
    },
  });
}
