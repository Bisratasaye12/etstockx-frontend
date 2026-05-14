"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { browserApi } from "@/shared/api/browser-api";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export type AdminWiringSmokeDto = {
  pendingBrokerApplications: number;
  pendingModerationListings: number;
  devSeedSampleAuditRows: number;
};

export function AdminWiringStatusCard() {
  const t = useTranslations("admin");
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "wiring-smoke"],
    queryFn: async () => {
      const { data: body } = await browserApi.get<AdminWiringSmokeDto>(
        "/v1/admin/wiring-smoke",
      );
      return body;
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>{t("wiring.title")}</CardTitle>
          <CardDescription>{t("wiring.subtitle")}</CardDescription>
        </div>
        <button
          type="button"
          className="text-primary text-sm underline-offset-4 hover:underline"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? t("wiring.loading") : t("wiring.refresh")}
        </button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading ? (
          <p className="text-muted-foreground">{t("wiring.loading")}</p>
        ) : error ? (
          <p className="text-destructive">{getApiErrorMessage(error)}</p>
        ) : data ? (
          <>
            <ul className="text-muted-foreground space-y-1">
              <li>
                {t("wiring.pendingBrokers", {
                  count: data.pendingBrokerApplications,
                })}
              </li>
              <li>
                {t("wiring.pendingListings", {
                  count: data.pendingModerationListings,
                })}
              </li>
              <li>
                {t("wiring.auditSamples", {
                  count: data.devSeedSampleAuditRows,
                })}
              </li>
            </ul>
            {data.pendingBrokerApplications === 0 &&
            data.pendingModerationListings === 0 &&
            data.devSeedSampleAuditRows === 0 ? (
              <p className="text-muted-foreground border-border rounded-md border bg-muted/30 p-3 text-xs leading-relaxed">
                {t("wiring.hintEmpty")}
              </p>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
