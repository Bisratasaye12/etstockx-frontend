import { getTranslations } from "next-intl/server";

export default async function MarketPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Market</h1>
      <p className="text-muted-foreground max-w-2xl text-sm">
        {t("stubMarket")}
      </p>
    </div>
  );
}
