import { getTranslations } from "next-intl/server";
import { ClientProfileSection } from "@/features/profiles/components/client-profile-section";

export default async function ClientProfilePage() {
  const t = await getTranslations("profile");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("clientTitle")}
      </h1>
      <ClientProfileSection />
    </div>
  );
}
