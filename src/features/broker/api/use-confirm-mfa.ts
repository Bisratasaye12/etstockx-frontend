import { useMutation } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { MfaConfirmRequestDto } from "@/shared/api/dtos/iam";

export function useConfirmMfa() {
  return useMutation({
    mutationFn: async (body: MfaConfirmRequestDto) => {
      await browserApi.post("/v1/auth/mfa/confirm", body);
    },
  });
}
