import { RequestDetailPage } from "@/features/broker/components/incoming/request-detail-page";

export default async function BrokerRequestDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { requestId } = await params;
  const { kind } = await searchParams;
  return <RequestDetailPage requestId={requestId} kind={kind ?? "Buy"} />;
}
