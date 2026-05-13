import { useMutation } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { ChangePasswordRequestDto } from "@/shared/api/dtos/iam";

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: ChangePasswordRequestDto) => {
      await browserApi.post("/v1/auth/change-password", body);
    },
  });
}
