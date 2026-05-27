"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  usePendingBrokerApplications,
  useVerifyBrokerApplication,
} from "@/features/admin/api/use-pending-brokers";
import { Link } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { AdminCardListSkeleton } from "@/features/admin/components/admin-skeletons";

async function openBrokerDocument(documentId: string) {
  const res = await browserApi.get(`/v1/auth/brokers/documents/${documentId}`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data as Blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function PendingBrokersPanel() {
  const t = useTranslations("admin");
  const { data, isLoading, error } = usePendingBrokerApplications();
  const verify = useVerifyBrokerApplication();
  const [reason, setReason] = useState("");
  const [docLoadingId, setDocLoadingId] = useState<string | null>(null);

  if (isLoading) {
    return <AdminCardListSkeleton rows={3} />;
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
          <CardTitle>{t("brokers.title")}</CardTitle>
          <CardDescription>
            {list.length === 0
              ? t("brokers.empty")
              : t("brokers.pendingSummary", { count: list.length })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{t("brokers.reasonLabel")}</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("brokers.reasonPlaceholder")}
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
                {app.documents?.length ? (
                  <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
                    {app.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-2">
                        <span className="truncate">
                          {doc.fileName ?? doc.id}
                        </span>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto px-0 py-0 text-xs"
                          disabled={docLoadingId === doc.id}
                          onClick={() => {
                            setDocLoadingId(doc.id);
                            void openBrokerDocument(doc.id)
                              .catch(() => {})
                              .finally(() => setDocLoadingId(null));
                          }}
                        >
                          {docLoadingId === doc.id ? "…" : t("brokers.viewDoc")}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    href={`/admin/brokers/${app.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    {t("brokers.view")}
                  </Link>
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
                    {t("brokers.approve")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={verify.isPending}
                    onClick={() =>
                      verify.mutate({
                        applicationId: app.id,
                        decision: "MoreInfo",
                        reason:
                          reason.trim() || t("brokers.defaultMoreInfoReason"),
                      })
                    }
                  >
                    {t("brokers.moreInfo")}
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
                    {t("brokers.reject")}
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
