import { getTranslations } from "next-intl/server";

export default async function BrokerListingsPage() {
  const t = await getTranslations("broker.stub");

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("listingsTitle")}
      </h1>
      <p className="text-muted-foreground text-sm">{t("lead")}</p>
    </div>
  );
}
