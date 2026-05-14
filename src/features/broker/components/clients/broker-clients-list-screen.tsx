"use client";

import { useMemo } from "react";
import { ChevronRight, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import { useBrokerIncomingRequests } from "@/features/broker/api/use-broker-incoming-requests";
import { uniqueClientsFromIncoming } from "@/features/broker/lib/unique-clients-from-incoming";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

const INCOMING_PAGE_SIZE = 200;

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function BrokerClientsListScreen() {
  const t = useTranslations("broker.clients");
  const incoming = useBrokerIncomingRequests(1, INCOMING_PAGE_SIZE);

  const clients = useMemo(
    () => uniqueClientsFromIncoming(incoming.data?.items ?? null),
    [incoming.data?.items],
  );

  if (incoming.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(incoming.error)}
      </p>
    );
  }

  if (incoming.isLoading) {
    return <p className="text-muted-foreground text-sm">{t("listLoading")}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t("listTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
          {t("listSubtitle")}
        </p>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr className="border-border border-b">
                <th className="px-4 py-3 text-left font-medium">
                  {t("listColClient")}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t("listColLastActivity")}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {t("listColAction")}
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td
                    className="text-muted-foreground px-4 py-12 text-center"
                    colSpan={3}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="bg-muted flex size-12 items-center justify-center rounded-full">
                        <Users
                          className="text-muted-foreground size-6"
                          aria-hidden
                        />
                      </span>
                      <p>{t("listEmpty")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr
                    key={c.clientId}
                    className="border-border hover:bg-muted/25 border-b transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.displayName}</p>
                      <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                        {t("idBadge", {
                          id: c.clientId.replace(/-/g, "").slice(0, 8),
                        })}
                      </p>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {fmtDate(c.lastRequestAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/broker/clients/${c.clientId}?name=${encodeURIComponent(c.displayName)}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "inline-flex",
                        )}
                      >
                        {t("listOpenHistory")}
                        <ChevronRight className="ml-1 size-4" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
