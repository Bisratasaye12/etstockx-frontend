import { getTranslations } from "next-intl/server";
import { BrokerProfileSection } from "@/features/broker/components/profile/broker-profile-section";

export default async function BrokerProfilePage() {
  const t = await getTranslations("profile");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("brokerTitle")}
      </h1>
      <BrokerProfileSection />
    </div>
  );
}
