import { auth } from "@/auth";
import { redirect } from "@/shared/i18n/routing";
import { InvestorMessagesPanel } from "@/features/investor/components/investor-messages-panel";

export default async function InvestorMessagesRoutePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "Client") {
    redirect({ href: "/dashboard", locale });
  }

  return <InvestorMessagesPanel />;
}
