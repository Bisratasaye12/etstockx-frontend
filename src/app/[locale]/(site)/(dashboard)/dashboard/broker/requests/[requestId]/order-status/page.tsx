import { OrderStatusPage } from "@/features/broker/components/orders/order-status-page";

export default async function BrokerOrderStatusRoute({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { requestId } = await params;
  const { kind } = await searchParams;
  return <OrderStatusPage requestId={requestId} kind={kind ?? "Buy"} />;
}
