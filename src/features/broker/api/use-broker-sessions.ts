import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { SessionDto } from "@/shared/api/dtos/iam";
import { brokerKeys } from "./keys";

export function useBrokerSessions() {
  return useQuery({
    queryKey: brokerKeys.sessions(),
    queryFn: async () => {
      const { data } = await browserApi.get<SessionDto[]>("/v1/auth/sessions");
      return data;
    },
  });
}

export function useRevokeBrokerSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await browserApi.delete(`/v1/auth/sessions/${sessionId}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: brokerKeys.sessions() });
    },
  });
}
