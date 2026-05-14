import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ListingDetailView } from "@/features/market/components/listing-detail-view";

function DetailFallback() {
  return (
    <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2 text-sm">
      <Loader2 className="size-5 animate-spin" aria-hidden />
    </div>
  );
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  return (
    <Suspense fallback={<DetailFallback />}>
      <ListingDetailView listingId={listingId} />
    </Suspense>
  );
}
