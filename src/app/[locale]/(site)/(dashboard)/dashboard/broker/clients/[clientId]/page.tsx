import { BrokerClientTradeHistoryScreen } from "@/features/broker/components/clients/broker-client-trade-history-screen";

export default async function BrokerClientTradeHistoryRoute({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { clientId } = await params;
  const { name } = await searchParams;
  return (
    <BrokerClientTradeHistoryScreen
      clientId={clientId}
      initialDisplayName={name ?? null}
    />
  );
}
