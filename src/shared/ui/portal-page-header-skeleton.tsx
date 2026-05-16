import { Skeleton } from "@/shared/ui/skeleton";

export function PortalPageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48 max-w-[70%]" />
      <Skeleton className="h-4 w-full max-w-xl" />
    </div>
  );
}
