import { Skeleton } from "@/shared/ui/skeleton";
import { PortalPageHeaderSkeleton } from "@/shared/ui/portal-page-header-skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";

function KpiCardSkeleton() {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-14" />
      </CardContent>
    </Card>
  );
}

function InvestorDashboardSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/80 lg:col-span-2 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InvestorTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-full max-w-md" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function InvestorGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-32 w-full rounded-none" />
          <CardContent className="space-y-2 pt-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InvestorMessagesSkeleton() {
  return (
    <div className="grid min-h-[480px] gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <Card>
        <CardContent className="space-y-2 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 pt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={cnSkeletonRow(i)} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function cnSkeletonRow(i: number) {
  return i % 2 === 0
    ? "ml-auto h-10 w-2/3 rounded-lg"
    : "h-10 w-2/3 rounded-lg";
}

function InvestorFormSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  );
}

export function InvestorProfileSettingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full max-w-md" />
      ))}
      <Skeleton className="h-10 w-28" />
    </div>
  );
}

function normalizeInvestorHref(href: string): string {
  return href.split("?")[0]?.replace(/\/$/, "") ?? href;
}

function InvestorRouteContentSkeleton({ href }: { href: string }) {
  const path = normalizeInvestorHref(href);

  if (path === "/dashboard") return <InvestorDashboardSkeleton />;
  if (path === "/requests/new") return <InvestorFormSkeleton />;
  if (path.startsWith("/requests")) return <InvestorTableSkeleton />;
  if (path === "/watchlist") return <InvestorGridSkeleton count={6} />;
  if (path.startsWith("/messages")) return <InvestorMessagesSkeleton />;
  if (path.startsWith("/market")) return <InvestorGridSkeleton />;
  if (path.startsWith("/brokers")) return <InvestorGridSkeleton count={6} />;
  if (path.startsWith("/profile/client"))
    return <InvestorProfileSettingsSkeleton />;

  return <InvestorTableSkeleton />;
}

export function InvestorNavigatingSkeleton({ href }: { href: string }) {
  const path = normalizeInvestorHref(href);
  const isProfile = path.startsWith("/profile/client");

  if (isProfile) {
    return (
      <div className="mx-auto max-w-[1180px] space-y-8">
        <PortalPageHeaderSkeleton />
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Skeleton className="hidden h-64 rounded-xl lg:block" />
          <InvestorProfileSettingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortalPageHeaderSkeleton />
      <InvestorRouteContentSkeleton href={href} />
    </div>
  );
}
