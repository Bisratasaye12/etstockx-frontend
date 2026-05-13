"use client";

import { Link } from "@/shared/i18n/routing";
import { useBrokerIncomingRequests } from "@/features/broker/api/use-broker-incoming-requests";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

function statusVariant(status: string | null | undefined) {
  const value = (status ?? "").toLowerCase();
  if (value.includes("pending")) return "destructive" as const;
  if (value.includes("negotiation")) return "secondary" as const;
  if (value.includes("filled") || value.includes("agreed"))
    return "default" as const;
  return "outline" as const;
}

export function IncomingRequestsPage() {
  const incoming = useBrokerIncomingRequests(1, 20);

  if (incoming.isLoading) {
    return <p className="text-muted-foreground text-sm">Loading requests…</p>;
  }

  if (incoming.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(incoming.error)}
      </p>
    );
  }

  const list = incoming.data?.items ?? [];
  const pending = list.filter((item) =>
    (item.status ?? "").toLowerCase().includes("pending"),
  ).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Incoming Requests
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage and process client orders and service requests.
          </p>
        </div>
        <Button variant="outline">Export CSV</Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-xs tracking-wide uppercase">
              Pending review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{pending}</p>
            <p className="text-muted-foreground text-sm">
              Requires immediate attention.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>Streamlined processing</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Ensure pending requests are reviewed within the SLA window.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="overflow-x-auto px-0">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Req ID</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Asset</th>
                <th className="px-4 py-3 text-left font-medium">
                  Date Submitted
                </th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-4 py-6">
                    No requests found.
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3 font-medium">
                      REQ-{item.id.slice(0, 4).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">{item.clientId.slice(0, 8)}…</td>
                    <td className="px-4 py-3">{item.kind ?? "—"}</td>
                    <td className="px-4 py-3">
                      {item.instrumentName ?? item.ticker ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(item.status)}>
                        {item.status ?? "Open"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/broker/requests/${item.id}?kind=${encodeURIComponent(item.kind ?? "Buy")}`}
                      >
                        <Button size="sm">Review</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
