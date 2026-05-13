import { BrokerListingPerformancePage } from "@/features/broker/components/listings/broker-listing-performance-page";

export default async function BrokerListingPerformanceRoute({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  return <BrokerListingPerformancePage listingId={listingId} />;
}
