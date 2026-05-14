import { getTranslations } from "next-intl/server";
import { ListingModerationPanel } from "@/features/admin/components/listing-moderation-panel";

export default async function AdminListingsPage() {
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("shell.listingsPageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("shell.listingsPageSubtitle")}
        </p>
      </div>
      <ListingModerationPanel />
    </div>
  );
}
