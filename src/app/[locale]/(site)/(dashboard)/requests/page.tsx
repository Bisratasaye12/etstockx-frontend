import { safeAuth } from "@/shared/lib/safe-auth";
import { redirect } from "@/shared/i18n/routing";
import { InvestorRequestsPanel } from "@/features/investor/components/investor-requests-panel";

export default async function InvestorRequestsRoutePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await safeAuth();
  if (!session?.user || session.user.role !== "Client") {
    redirect({ href: "/dashboard", locale });
  }

  return <InvestorRequestsPanel />;
}
