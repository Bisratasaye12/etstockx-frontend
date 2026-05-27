import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { BrokerApplication } from "@/shared/api/types";

export const adminKeys = {
  pendingBrokers: ["admin", "brokers", "pending"] as const,
};

export function usePendingBrokerApplications() {
  return useQuery({
    queryKey: adminKeys.pendingBrokers,
    queryFn: async () => {
      const { data } = await browserApi.get<BrokerApplication[]>(
        "/v1/auth/brokers/pending",
      );
      return data;
    },
  });
}

export function usePendingBrokerApplication(applicationId: string | null) {
  return useQuery({
    queryKey: ["admin", "brokers", "pending", "detail", applicationId] as const,
    enabled: Boolean(applicationId),
    queryFn: async () => {
      const { data } = await browserApi.get<BrokerApplication[]>(
        "/v1/auth/brokers/pending",
      );
      return (
        data.find((application) => application.id === applicationId) ?? null
      );
    },
  });
}

export function useVerifyBrokerApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicationId,
      decision,
      reason,
    }: {
      applicationId: string;
      decision: string;
      reason?: string | null;
    }) => {
      await browserApi.post(`/v1/auth/brokers/${applicationId}/verify`, {
        decision,
        reason: reason ?? null,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.pendingBrokers });
    },
  });
}
