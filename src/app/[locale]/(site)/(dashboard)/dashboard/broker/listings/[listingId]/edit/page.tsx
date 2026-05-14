import { BrokerEditListingPage } from "@/features/broker/components/listings/broker-edit-listing-page";

export default async function BrokerEditListingRoute({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  return <BrokerEditListingPage listingId={listingId} />;
}
