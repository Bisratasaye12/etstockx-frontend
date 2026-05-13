import { useMutation } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  MfaEnableResponseDto,
  MfaPasswordRequestDto,
} from "@/shared/api/dtos/iam";

export function useEnableMfa() {
  return useMutation({
    mutationFn: async (body: MfaPasswordRequestDto) => {
      const { data } = await browserApi.post<MfaEnableResponseDto>(
        "/v1/auth/mfa/enable",
        body,
      );
      return data;
    },
  });
}
