"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  usePendingBrokerApplication,
  useVerifyBrokerApplication,
} from "@/features/admin/api/use-pending-brokers";
import { Link, useRouter } from "@/shared/i18n/routing";
import { browserApi } from "@/shared/api/browser-api";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

async function openBrokerDocument(documentId: string) {
  const res = await browserApi.get(`/v1/auth/brokers/documents/${documentId}`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data as Blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function formatDateTime(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type BrokerApplicationDetailPageProps = {
  applicationId: string;
};

export function BrokerApplicationDetailPage({
  applicationId,
}: BrokerApplicationDetailPageProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [docLoadingId, setDocLoadingId] = useState<string | null>(null);
  const { data, isLoading, error } = usePendingBrokerApplication(applicationId);
  const verify = useVerifyBrokerApplication();

  const submittedAt = useMemo(
    () => formatDateTime(data?.submittedAt, locale),
    [data?.submittedAt, locale],
  );

  const submitDecision = (decision: "Approve" | "Reject") => {
    const trimmedReason = reason.trim();
    if (decision === "Reject" && trimmedReason.length === 0) {
      setFormError(t("brokers.reasonRequiredReject"));
      return;
    }
    setFormError(null);
    verify.mutate(
      {
        applicationId,
        decision,
        reason: decision === "Approve" ? null : trimmedReason,
      },
      {
        onSuccess: () => {
          router.push("/admin/brokers");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("brokers.loadingDetail")}
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-destructive text-sm">{getApiErrorMessage(error)}</p>
    );
  }

  if (!data) {
    return (
      <p className="text-muted-foreground text-sm">{t("brokers.notFound")}</p>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{data.fullName ?? "—"}</CardTitle>
          <CardDescription>{data.email ?? "—"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("brokers.status")}</dt>
              <dd className="font-medium">{data.status ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("brokers.submittedAt")}
              </dt>
              <dd>{submittedAt}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("brokers.license")}</dt>
              <dd className="font-mono text-xs">{data.licenseNumber ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("brokers.institution")}
              </dt>
              <dd>{data.institution ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">
                {t("brokers.ecmaReference")}
              </dt>
              <dd>{data.ecmaReference ?? "—"}</dd>
            </div>
          </dl>

          <div className="space-y-2">
            <Label className="text-base">{t("brokers.documentsTitle")}</Label>
            {data.documents?.length ? (
              <ul className="space-y-2">
                {data.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="border-border flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {doc.fileName ?? doc.id}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {doc.documentType ?? "—"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("brokers.noDocuments")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="broker-decision-reason">
              {t("brokers.reasonLabel")}
            </Label>
            <Input
              id="broker-decision-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("brokers.reasonPlaceholder")}
            />
          </div>

          {formError ? (
            <p className="text-destructive text-sm">{formError}</p>
          ) : null}
          {verify.isError ? (
            <p className="text-destructive text-sm">
              {getApiErrorMessage(verify.error)}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/brokers"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t("brokers.backToQueue")}
            </Link>
            <Button
              type="button"
              size="sm"
              disabled={verify.isPending}
              onClick={() => submitDecision("Approve")}
            >
              {verify.isPending
                ? t("brokers.submitting")
                : t("brokers.approve")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={verify.isPending}
              onClick={() => submitDecision("Reject")}
            >
              {verify.isPending ? t("brokers.submitting") : t("brokers.reject")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
