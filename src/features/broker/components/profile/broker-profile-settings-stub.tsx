"use client";

import { useTranslations } from "next-intl";

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

export function BrokerProfileSettingsStub({
  titleKey,
}: {
  titleKey:
    | "stubTwoFactorTitle"
    | "stubSessionsTitle"
    | "stubNotificationsTitle";
}) {
  const t = useTranslations("broker.profile");

  return (
    <div className={panelSurface}>
      <div className="border-border border-b px-6 py-5 md:px-8 md:py-6">
        <h2 className="text-lg font-semibold tracking-tight">{t(titleKey)}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {t("stubLead")}
        </p>
      </div>
    </div>
  );
}
