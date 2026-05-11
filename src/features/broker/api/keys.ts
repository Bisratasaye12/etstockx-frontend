import { profileKeys } from "@/features/profiles/api/keys";

export const brokerKeys = {
  all: ["broker"] as const,
  summary: () => [...brokerKeys.all, "summary"] as const,
  incoming: (page: number, pageSize: number) =>
    [...brokerKeys.all, "incoming", page, pageSize] as const,
  sessions: () => [...brokerKeys.all, "sessions"] as const,
  /** Same query key as profiles — shared cache for `GET /v1/profiles/broker/me`. */
  brokerProfile: () => profileKeys.brokerMe(),
};
