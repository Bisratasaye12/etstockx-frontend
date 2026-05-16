"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { profileKeys } from "@/features/profiles/api/keys";
import {
  PROFILE_AVATAR_ACCEPT,
  uploadProfileAvatar,
  validateProfileAvatarFile,
  type ProfileAvatarValidationError,
} from "@/features/profiles/api/profile-avatar";
import { useProfileAvatarSrc } from "@/features/profiles/hooks/use-profile-avatar-src";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const SIZE_CLASS = {
  sm: "size-16",
  md: "size-24",
  lg: "size-28",
  xl: "size-[104px]",
} as const;

type ProfileAvatarUploadFieldProps = {
  userId: string;
  profileImageUrl?: string | null;
  storagePath?: string | null;
  fallback: ReactNode;
  size?: keyof typeof SIZE_CLASS;
  invalidateQueryKeys: QueryKey[];
  layout?: "inline" | "stacked" | "compact";
  showHint?: boolean;
  className?: string;
};

export function ProfileAvatarUploadField({
  userId,
  profileImageUrl,
  storagePath,
  fallback,
  size = "md",
  invalidateQueryKeys,
  layout = "inline",
  showHint = true,
  className,
}: ProfileAvatarUploadFieldProps) {
  const t = useTranslations("profile.avatar");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [cacheBust, setCacheBust] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [validationError, setValidationError] =
    useState<ProfileAvatarValidationError | null>(null);

  const { src, isLoading } = useProfileAvatarSrc({
    userId,
    profileImageUrl,
    storagePath,
    cacheBust,
  });

  const displaySrc = localPreview ?? src;

  const uploadMutation = useMutation({
    mutationFn: uploadProfileAvatar,
    onSuccess: async () => {
      setCacheBust((n) => n + 1);
      await Promise.all([
        ...invalidateQueryKeys.map((queryKey) =>
          qc.invalidateQueries({ queryKey }),
        ),
        qc.invalidateQueries({ queryKey: profileKeys.avatar(userId) }),
      ]);
    },
  });

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  function openPicker() {
    if (!uploadMutation.isPending) {
      inputRef.current?.click();
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validation = validateProfileAvatarFile(file);
    if (validation) {
      setValidationError(validation);
      uploadMutation.reset();
      return;
    }

    setValidationError(null);
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    uploadMutation.mutate(file, {
      onError: () => {
        URL.revokeObjectURL(previewUrl);
        setLocalPreview(null);
      },
    });
  }

  const errorMessage = validationError
    ? t(validationError)
    : uploadMutation.isError
      ? getApiErrorMessage(uploadMutation.error) || t("uploadFailed")
      : null;

  const imageBlock = (
    <div className="relative mx-auto shrink-0 sm:mx-0">
      <div
        className={cn(
          "border-border bg-muted/40 flex items-center justify-center overflow-hidden border-2 border-dashed",
          SIZE_CLASS[size],
          size === "sm" ? "rounded-2xl" : "rounded-full",
        )}
      >
        {displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob or API-backed preview
          <img src={displaySrc} alt="" className="size-full object-cover" />
        ) : isLoading ? (
          <span className="text-muted-foreground text-xs">…</span>
        ) : (
          fallback
        )}
      </div>
      <button
        type="button"
        className={cn(
          "border-background bg-primary text-primary-foreground absolute flex items-center justify-center rounded-full border-2 shadow-md",
          size === "sm"
            ? "size-7 -right-0.5 bottom-0"
            : "size-8 -right-1 bottom-0",
          size === "xl" && "size-9 -right-0.5 bottom-0",
        )}
        onClick={openPicker}
        disabled={uploadMutation.isPending}
        aria-label={t("changePhoto")}
      >
        <Pencil className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden />
      </button>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={PROFILE_AVATAR_ACCEPT.join(",")}
        className="sr-only"
        onChange={onFileChange}
      />
    </div>
  );

  if (layout === "compact") {
    return (
      <div className={className}>
        {imageBlock}
        {errorMessage ? (
          <p className="text-destructive mt-2 text-xs" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  }

  if (layout === "stacked") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex justify-center sm:justify-start">{imageBlock}</div>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-lg font-medium sm:w-auto"
          onClick={openPicker}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? t("uploading") : t("uploadCta")}
        </Button>
        {showHint ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t("hint")}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-start",
        className,
      )}
    >
      {imageBlock}
      <div className="min-w-0 flex-1 space-y-3">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-lg font-medium"
          onClick={openPicker}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? t("uploading") : t("uploadCta")}
        </Button>
        {showHint ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t("hint")}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
