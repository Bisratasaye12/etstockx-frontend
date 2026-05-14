import { BrokerConversationThread } from "@/features/broker/components/messages/thread/broker-conversation-thread";

export default async function BrokerMessageConversationRoute({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <BrokerConversationThread conversationId={conversationId} />;
}
