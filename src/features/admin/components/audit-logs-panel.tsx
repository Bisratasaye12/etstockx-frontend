"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  type AuditLogFilters,
  useAuditLogs,
} from "@/features/admin/api/use-audit-logs";
import type { AuditLogDto } from "@/shared/api/dtos/admin-portal";
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

function toIsoStartOfDay(dateStr: string): string | undefined {
  if (!dateStr.trim()) return undefined;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function toIsoEndOfDay(dateStr: string): string | undefined {
  if (!dateStr.trim()) return undefined;
  const d = new Date(`${dateStr}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function auditLogsToCsv(rows: AuditLogDto[]): string {
  const header = [
    "id",
    "occurredAt",
    "actorId",
    "actionType",
    "entityType",
    "entityId",
    "ipAddress",
    "oldValue",
    "newValue",
  ];
  const escape = (v: string | null | undefined) => {
    let s = v ?? "";
    // Spreadsheet formula injection (OWASP): neutralize leading triggers before CSV quoting.
    if (/^[=+\-@\t\r]/.test(s.replace(/^\uFEFF/, ""))) {
      s = `'${s}`;
    }
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = rows.map((r) =>
    [
      r.id,
      r.occurredAt,
      r.actorId,
      r.actionType,
      r.entityType,
      r.entityId,
      r.ipAddress,
      r.oldValue,
      r.newValue,
    ]
      .map((c) => escape(c))
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AuditLogsPanel() {
  const t = useTranslations("admin");
  const locale = useLocale();

  const [draft, setDraft] = useState({
    fromDate: "",
    toDate: "",
    actionType: "",
    entityType: "",
    actorId: "",
  });
  const [applied, setApplied] = useState<AuditLogFilters>({});

  const { data: logs = [], isLoading, error, refetch } = useAuditLogs(applied);

  const sorted = useMemo(
    () =>
      [...logs].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
    [logs],
  );

  const applyFilters = () => {
    setApplied({
      from: toIsoStartOfDay(draft.fromDate),
      to: toIsoEndOfDay(draft.toDate),
      actionType: draft.actionType.trim() || undefined,
      entityType: draft.entityType.trim() || undefined,
      actorId: draft.actorId.trim() || undefined,
    });
  };

  const clearFilters = () => {
    setDraft({
      fromDate: "",
      toDate: "",
      actionType: "",
      entityType: "",
      actorId: "",
    });
    setApplied({});
  };

  const onExport = () => {
    const csv = auditLogsToCsv(sorted);
    downloadCsv(`audit-logs-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  if (error) {
    return (
      <p className="text-destructive text-sm">{getApiErrorMessage(error)}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onExport}>
            {t("audit.exportCsv")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
          >
            {t("audit.refresh")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("audit.filtersTitle")}</CardTitle>
          <CardDescription>{t("audit.filtersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="audit-from">{t("audit.from")}</Label>
            <Input
              id="audit-from"
              type="date"
              value={draft.fromDate}
              onChange={(e) =>
                setDraft((d) => ({ ...d, fromDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-to">{t("audit.to")}</Label>
            <Input
              id="audit-to"
              type="date"
              value={draft.toDate}
              onChange={(e) =>
                setDraft((d) => ({ ...d, toDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-action">{t("audit.actionType")}</Label>
            <Input
              id="audit-action"
              value={draft.actionType}
              onChange={(e) =>
                setDraft((d) => ({ ...d, actionType: e.target.value }))
              }
              placeholder={t("audit.actionTypePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-entity">{t("audit.entityType")}</Label>
            <Input
              id="audit-entity"
              value={draft.entityType}
              onChange={(e) =>
                setDraft((d) => ({ ...d, entityType: e.target.value }))
              }
              placeholder={t("audit.entityTypePlaceholder")}
            />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label htmlFor="audit-actor">{t("audit.actorId")}</Label>
            <Input
              id="audit-actor"
              value={draft.actorId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, actorId: e.target.value }))
              }
              placeholder={t("audit.actorIdPlaceholder")}
            />
          </div>
          <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-3">
            <Button type="button" onClick={applyFilters}>
              {t("audit.apply")}
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              {t("audit.clear")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("audit.resultsTitle")}</CardTitle>
          {!isLoading ? (
            <CardDescription>
              {t("audit.resultCount", { count: sorted.length })}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">
              {t("audit.loading")}
            </p>
          ) : sorted.length === 0 ? (
            <div className="text-muted-foreground space-y-2 py-8 text-center text-sm">
              <p>{t("audit.noResults")}</p>
              <button
                type="button"
                className="text-primary underline"
                onClick={clearFilters}
              >
                {t("audit.clear")}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-muted-foreground py-2 pr-4 font-medium">
                      {t("audit.colTime")}
                    </th>
                    <th className="text-muted-foreground py-2 pr-4 font-medium">
                      {t("audit.colAction")}
                    </th>
                    <th className="text-muted-foreground py-2 pr-4 font-medium">
                      {t("audit.colEntity")}
                    </th>
                    <th className="text-muted-foreground py-2 pr-4 font-medium">
                      {t("audit.colActor")}
                    </th>
                    <th className="text-muted-foreground py-2 font-medium">
                      {t("audit.colIp")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr key={row.id} className="border-border border-b">
                      <td className="py-2 pr-4 align-top whitespace-nowrap">
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(row.occurredAt))}
                      </td>
                      <td className="py-2 pr-4 align-top font-medium">
                        {row.actionType}
                      </td>
                      <td className="text-muted-foreground py-2 pr-4 align-top">
                        {row.entityType ?? "—"}
                        {row.entityId ? (
                          <span className="mt-0.5 block font-mono text-xs">
                            {row.entityId}
                          </span>
                        ) : null}
                      </td>
                      <td className="text-muted-foreground py-2 pr-4 align-top font-mono text-xs">
                        {row.actorId ?? "—"}
                      </td>
                      <td className="text-muted-foreground py-2 align-top font-mono text-xs">
                        {row.ipAddress ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
