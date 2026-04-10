"use client";

import { useTranslations } from "next-intl";
import { useBrokerDirectory } from "@/features/profiles/api/use-broker-directory";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

export function BrokerDirectorySection() {
  const t = useTranslations("profile");
  const { data, isLoading, error } = useBrokerDirectory();

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">…</p>;
  }
  if (error) {
    return (
      <p className="text-destructive text-sm">{getApiErrorMessage(error)}</p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("brokersDirectory")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {(data ?? []).map((b) => (
            <li
              key={b.userId}
              className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm"
            >
              <div>
                <p className="font-medium">{b.institution ?? "—"}</p>
                <p className="text-muted-foreground font-mono text-xs">
                  {b.licenseDisplay ?? ""}
                </p>
              </div>
              <Badge variant={b.isAcceptingRequests ? "default" : "secondary"}>
                {b.isAcceptingRequests ? t("acceptingRequests") : "—"}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
