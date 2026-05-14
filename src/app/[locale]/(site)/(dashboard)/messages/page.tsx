import { auth } from "@/auth";
import { redirect } from "@/shared/i18n/routing";
import { BrokerMessagesScreen } from "@/features/broker/components/messages/broker-messages-screen";

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

  return <BrokerMessagesScreen portal="investor" />;
}
