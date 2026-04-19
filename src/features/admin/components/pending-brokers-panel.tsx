"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  usePendingBrokerApplications,
  useVerifyBrokerApplication,
} from "@/features/admin/api/use-pending-brokers";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export function PendingBrokersPanel() {
  const t = useTranslations("admin");
  const { data, isLoading, error } = usePendingBrokerApplications();
  const verify = useVerifyBrokerApplication();
  const [reason, setReason] = useState("");

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">…</p>;
  }
  if (error) {
    return (
      <p className="text-destructive text-sm">{getApiErrorMessage(error)}</p>
    );
  }

  const list = data ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {list.length === 0 ? t("empty") : `${list.length} pending`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (reject / more info)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required for Reject or MoreInfo"
            />
          </div>
          {verify.isError ? (
            <p className="text-destructive text-sm">
              {getApiErrorMessage(verify.error)}
            </p>
          ) : null}
          <ul className="space-y-4">
            {list.map((app) => (
              <li
                key={app.id}
                className="border-border space-y-2 rounded-lg border p-4"
              >
                <p className="font-medium">{app.fullName ?? "—"}</p>
                <p className="text-muted-foreground text-sm">
                  {app.email ?? "—"}
                </p>
                <p className="font-mono text-xs">{app.licenseNumber ?? "—"}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={verify.isPending}
                    onClick={() =>
                      verify.mutate({
                        applicationId: app.id,
                        decision: "Approve",
                        reason: null,
                      })
                    }
                  >
                    {t("approve")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={verify.isPending}
                    onClick={() =>
                      verify.mutate({
                        applicationId: app.id,
                        decision: "Reject",
                        reason: reason.trim() || "Rejected",
                      })
                    }
                  >
                    {t("reject")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
