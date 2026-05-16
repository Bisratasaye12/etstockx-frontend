import { Skeleton } from "@/shared/ui/skeleton";
import { PortalPageHeaderSkeleton } from "@/shared/ui/portal-page-header-skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";

function KpiCardSkeleton() {
  return (
    <Card size="sm" className="border-border/80 shadow-sm">
      <CardContent className="space-y-3 pt-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function BrokerDashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BrokerTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function BrokerListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

function BrokerSplitSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <BrokerListSkeleton rows={6} />
      <Card className="min-h-[320px]">
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BrokerFormSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  );
}

export function BrokerProfileSettingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full max-w-md" />
      ))}
      <Skeleton className="h-10 w-28" />
    </div>
  );
}

function normalizeBrokerHref(href: string): string {
  const path = href.split("?")[0]?.replace(/\/$/, "") ?? href;
  if (path === "/dashboard/broker") return "/dashboard/broker";
  return path;
}

function BrokerRouteContentSkeleton({ href }: { href: string }) {
  const path = normalizeBrokerHref(href);

  if (path === "/dashboard/broker") {
    return <BrokerDashboardSkeleton />;
  }
  if (path.startsWith("/dashboard/broker/requests")) {
    return <BrokerTableSkeleton />;
  }
  if (path.includes("/listings/new") || path.includes("/edit")) {
    return <BrokerFormSkeleton />;
  }
  if (path.startsWith("/dashboard/broker/listings")) {
    return <BrokerListSkeleton rows={6} />;
  }
  if (path.startsWith("/dashboard/broker/clients")) {
    return <BrokerTableSkeleton rows={6} />;
  }
  if (path.startsWith("/dashboard/broker/messages")) {
    return <BrokerSplitSkeleton />;
  }
  if (path.startsWith("/profile/broker")) {
    return <BrokerProfileSettingsSkeleton />;
  }

  return <BrokerTableSkeleton />;
}

export function BrokerNavigatingSkeleton({ href }: { href: string }) {
  const path = normalizeBrokerHref(href);
  const isProfile = path.startsWith("/profile/broker");

  if (isProfile) {
    return (
      <div className="mx-auto max-w-[1180px] space-y-8">
        <PortalPageHeaderSkeleton />
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Skeleton className="hidden h-64 rounded-xl lg:block" />
          <BrokerProfileSettingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortalPageHeaderSkeleton />
      <BrokerRouteContentSkeleton href={href} />
    </div>
  );
}
