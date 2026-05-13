import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ListingsExplorer } from "@/features/market/components/listings-explorer";

function ExplorerFallback() {
  return (
    <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2 text-sm">
      <Loader2 className="size-5 animate-spin" aria-hidden />
    </div>
  );
}

export default function MarketPage() {
  return (
    <Suspense fallback={<ExplorerFallback />}>
      <ListingsExplorer />
    </Suspense>
  );
}
