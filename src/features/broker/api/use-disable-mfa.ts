import { useMutation } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { MfaPasswordRequestDto } from "@/shared/api/dtos/iam";

export function useDisableMfa() {
  return useMutation({
    mutationFn: async (body: MfaPasswordRequestDto) => {
      await browserApi.post("/v1/auth/mfa/disable", body);
    },
  });
}
