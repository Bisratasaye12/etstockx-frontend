import { browserApi } from "@/shared/api/browser-api";
import type { ProfileAvatarUploadResult } from "@/shared/api/types";

export const PROFILE_AVATAR_MAX_BYTES = 5_000_000;
export const PROFILE_AVATAR_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ProfileAvatarValidationError = "invalidType" | "tooLarge";

export function validateProfileAvatarFile(
  file: File,
): ProfileAvatarValidationError | null {
  if (
    !PROFILE_AVATAR_ACCEPT.includes(
      file.type as (typeof PROFILE_AVATAR_ACCEPT)[number],
    )
  ) {
    return "invalidType";
  }
  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    return "tooLarge";
  }
  return null;
}

export async function uploadProfileAvatar(
  file: File,
): Promise<ProfileAvatarUploadResult> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await browserApi.post<ProfileAvatarUploadResult>(
    "/v1/profiles/me/avatar",
    form,
  );
  return data;
}

export function getProfileAvatarDownloadPath(
  userId: string,
  isSelf: boolean,
): string {
  return isSelf
    ? "/v1/profiles/me/avatar"
    : `/v1/profiles/users/${userId}/avatar`;
}
