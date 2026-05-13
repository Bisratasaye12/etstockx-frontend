import { auth } from "@/auth";
import { redirect } from "@/shared/i18n/routing";
import { InvestorCreateRequestView } from "@/features/investor/components/investor-create-request-view";

export default async function InvestorCreateRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "Client") {
    redirect({ href: "/dashboard", locale });
  }

  return <InvestorCreateRequestView />;
}
