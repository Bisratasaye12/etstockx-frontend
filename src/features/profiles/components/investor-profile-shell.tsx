"use client";

import { useTranslations } from "next-intl";
import { useClientProfile } from "@/features/profiles/api/use-client-profile";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { InvestorProfileOnboarding } from "@/features/profiles/components/investor-profile-onboarding";
import { InvestorMyProfile } from "@/features/profiles/components/investor-my-profile";

export function InvestorProfileShell() {
  const tc = useTranslations("common");
  const { data, isLoading, error } = useClientProfile();

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{tc("loading")}</p>;
  }

  if (error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(error)}
      </p>
    );
  }

  if (!data) return null;

  if (!data.isProfileComplete) {
    return <InvestorProfileOnboarding profile={data} />;
  }

  return <InvestorMyProfile profile={data} />;
}
