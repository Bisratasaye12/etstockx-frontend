import { profileKeys } from "@/features/profiles/api/keys";

export const brokerKeys = {
  all: ["broker"] as const,
  summary: () => [...brokerKeys.all, "summary"] as const,
  incoming: (page: number, pageSize: number) =>
    [...brokerKeys.all, "incoming", page, pageSize] as const,
  listingsMine: (page: number, pageSize: number) =>
    [...brokerKeys.all, "listings", "mine", page, pageSize] as const,
  listingDetail: (listingId: string) =>
    [...brokerKeys.all, "listings", "detail", listingId] as const,
  listingPerformance: (listingId: string, from?: string, to?: string) =>
    [
      ...brokerKeys.all,
      "listings",
      "performance",
      listingId,
      from ?? "",
      to ?? "",
    ] as const,
  sessions: () => [...brokerKeys.all, "sessions"] as const,
  /** Same query key as profiles — shared cache for `GET /v1/profiles/broker/me`. */
  brokerProfile: () => profileKeys.brokerMe(),
  clientHistory: (
    clientId: string,
    params: {
      from?: string;
      to?: string;
      instrument?: string;
      page: number;
      pageSize: number;
    },
  ) =>
    [
      ...brokerKeys.all,
      "clientHistory",
      clientId,
      params.from ?? "",
      params.to ?? "",
      params.instrument ?? "",
      params.page,
      params.pageSize,
    ] as const,
};
