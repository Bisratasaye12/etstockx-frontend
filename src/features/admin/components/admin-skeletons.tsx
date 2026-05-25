import { Skeleton } from "@/shared/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";

export function AdminPageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48 max-w-[70%]" />
      <Skeleton className="h-4 w-full max-w-xl" />
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <Card size="sm" className="border-border/80 shadow-sm">
      <CardHeader className="space-y-2 pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-3 w-full max-w-[180px]" />
      </CardContent>
    </Card>
  );
}

export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading overview">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Skeleton className="h-4 w-56" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <section className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-border/80 shadow-sm">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-full max-w-sm" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-44 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-border/80 shadow-sm">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-full max-w-xs" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <Card className="border-border/80 shadow-sm xl:col-span-2">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminCardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
}

export function AdminTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-24" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="mb-3 h-9 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function AdminSplitPanelSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
      <AdminCardListSkeleton rows={5} />
      <Card className="min-h-[320px]">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
          <Skeleton className="mt-4 h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminUsersSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-full max-w-xs" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
        <AdminTableSkeleton rows={5} />
      </div>
    </div>
  );
}

function normalizeAdminHref(href: string): string {
  if (href === "/admin" || href.endsWith("/admin")) {
    return "/admin/overview";
  }
  return href.split("?")[0] ?? href;
}

function AdminAuditLogsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
      <AdminTableSkeleton rows={8} />
    </div>
  );
}

function AdminRouteContentSkeleton({ href }: { href: string }) {
  const route = normalizeAdminHref(href);

  switch (route) {
    case "/admin/overview":
      return <AdminOverviewSkeleton />;
    case "/admin/brokers":
      return <AdminCardListSkeleton rows={3} />;
    case "/admin/listings":
      return <AdminSplitPanelSkeleton />;
    case "/admin/securities":
      return <AdminSplitPanelSkeleton />;
    case "/admin/audit-logs":
      return <AdminAuditLogsSkeleton />;
    case "/admin/users":
      return <AdminUsersSkeleton />;
    default:
      return <AdminCardListSkeleton rows={3} />;
  }
}

/** Skeleton for a specific admin route (header + page body). */
export function AdminNavigatingSkeleton({ href }: { href: string }) {
  return (
    <div className="space-y-6">
      <AdminPageHeaderSkeleton />
      <AdminRouteContentSkeleton href={href} />
    </div>
  );
}

/** Shown while Next.js loads an admin route (uses current pathname). */
export { AdminRouteLoadingClient as AdminRouteLoading } from "@/features/admin/components/admin-route-loading-client";
