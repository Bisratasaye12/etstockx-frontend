import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { SecurityDto } from "@/features/market/model/security-types";
import { marketKeys } from "@/features/market/api/keys";

export type CreateSecurityPayload = {
  ticker: string;
  name: string;
  sector?: string | null;
  isin?: string | null;
  referencePrice?: number | null;
  referenceCurrency?: string;
};

export type UpdateSecurityPayload = {
  name: string;
  sector?: string | null;
  isin?: string | null;
  status: string;
};

export function useAdminSecurityDetail(id: string | null) {
  return useQuery({
    queryKey: [...marketKeys.all, "admin-security", id] as const,
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await browserApi.get<SecurityDto>(
        `/v1/admin/securities/${id}`,
      );
      return data;
    },
  });
}

export function useCreateSecurity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSecurityPayload) => {
      const { data } = await browserApi.post<{ id: string }>(
        "/v1/admin/securities",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: marketKeys.all });
    },
  });
}

export function useUpdateSecurity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdateSecurityPayload & { id: string }) => {
      await browserApi.put(`/v1/admin/securities/${id}`, payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: marketKeys.all });
    },
  });
}

export function useUpdateSecurityReferencePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      referencePrice,
      referenceCurrency = "ETB",
    }: {
      id: string;
      referencePrice: number;
      referenceCurrency?: string;
    }) => {
      await browserApi.put(`/v1/admin/securities/${id}/reference-price`, {
        referencePrice,
        referenceCurrency,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: marketKeys.all });
    },
  });
}
