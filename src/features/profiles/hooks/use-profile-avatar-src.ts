"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { browserApi } from "@/shared/api/browser-api";
import { profileKeys } from "@/features/profiles/api/keys";
import { getProfileAvatarDownloadPath } from "@/features/profiles/api/profile-avatar";
import {
  isApiHostedMediaUrl,
  resolveProfileMediaUrl,
} from "@/features/profiles/lib/resolve-profile-media-url";

type UseProfileAvatarSrcOptions = {
  userId: string;
  isSelf?: boolean;
  profileImageUrl?: string | null;
  storagePath?: string | null;
  enabled?: boolean;
  /** Bust blob cache after upload. */
  cacheBust?: number;
};

export function useProfileAvatarSrc({
  userId,
  isSelf = true,
  profileImageUrl,
  storagePath,
  enabled = true,
  cacheBust = 0,
}: UseProfileAvatarSrcOptions) {
  const resolved = useMemo(() => {
    const fromImage = resolveProfileMediaUrl(profileImageUrl);
    const fromPath = resolveProfileMediaUrl(storagePath);
    return fromImage ?? fromPath;
  }, [profileImageUrl, storagePath]);

  const directUrl = useMemo(() => {
    if (!resolved) return null;
    if (isApiHostedMediaUrl(resolved)) return null;
    return resolved;
  }, [resolved]);

  const hasStoredAvatar = Boolean(
    profileImageUrl?.trim() || storagePath?.trim() || cacheBust > 0,
  );

  const blobQuery = useQuery({
    queryKey: profileKeys.avatar(userId, String(cacheBust)),
    enabled: enabled && !directUrl && hasStoredAvatar,
    queryFn: async (): Promise<Blob | null> => {
      try {
        const { data } = await browserApi.get<Blob>(
          getProfileAvatarDownloadPath(userId, isSelf),
          { responseType: "blob" },
        );
        return data;
      } catch (e) {
        if (isAxiosError(e) && e.response?.status === 404) {
          return null;
        }
        throw e;
      }
    },
    staleTime: 60_000,
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = blobQuery.data;
    if (!blob) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blobQuery.data]);

  const src = directUrl ?? objectUrl ?? null;

  return {
    src,
    isLoading: blobQuery.isLoading && !directUrl && hasStoredAvatar,
    isError: blobQuery.isError,
    error: blobQuery.error,
    refetch: blobQuery.refetch,
  };
}
