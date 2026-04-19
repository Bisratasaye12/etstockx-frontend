import { getTranslations } from "next-intl/server";
import { BrokerDirectorySection } from "@/features/profiles/components/broker-directory-section";

export default async function BrokersPage() {
  const t = await getTranslations("home");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("brokersPageTitle")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {t("brokersPageIntro")}
        </p>
      </header>
      <BrokerDirectorySection />
    </div>
  );
}
