import { auth } from "@/auth";
import { redirect } from "@/shared/i18n/routing";
import { InvestorConversationThread } from "@/features/investor/components/investor-conversation-thread";

export default async function InvestorConversationPage({
  params,
}: {
  params: Promise<{ locale: string; conversationId: string }>;
}) {
  const { locale, conversationId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "Client") {
    redirect({ href: "/dashboard", locale });
  }

  return <InvestorConversationThread conversationId={conversationId} />;
}
