"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { useMarketSecurities } from "@/features/market/api/use-market-securities";
import {
  useAdminSecurityDetail,
  useCreateSecurity,
  useUpdateSecurity,
  useUpdateSecurityReferencePrice,
} from "@/features/admin/api/use-admin-securities";
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
import { AdminSplitPanelSkeleton } from "@/features/admin/components/admin-skeletons";
import { cn } from "@/shared/lib/utils";

const LIST_PAGE_SIZE = 50;

export function AdminSecuritiesPanel() {
  const t = useTranslations("admin.securities");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "create">("edit");

  const listQuery = useMarketSecurities(search, 1, LIST_PAGE_SIZE, true);
  const items = useMemo(() => {
    const all = listQuery.data?.items ?? [];
    if (!statusFilter) return all;
    return all.filter(
      (s) => s.status.toLowerCase() === statusFilter.toLowerCase(),
    );
  }, [listQuery.data?.items, statusFilter]);

  const detailQuery = useAdminSecurityDetail(selectedId);
  const createMutation = useCreateSecurity();
  const updateMutation = useUpdateSecurity();
  const refPriceMutation = useUpdateSecurityReferencePrice();

  const [formError, setFormError] = useState<string | null>(null);

  const [createTicker, setCreateTicker] = useState("");
  const [createName, setCreateName] = useState("");
  const [createSector, setCreateSector] = useState("");
  const [createRefPrice, setCreateRefPrice] = useState("");
  const [createCurrency, setCreateCurrency] = useState("ETB");

  const [editName, setEditName] = useState("");
  const [editSector, setEditSector] = useState("");
  const [editIsin, setEditIsin] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [refPrice, setRefPrice] = useState("");

  useEffect(() => {
    const s = detailQuery.data;
    if (!s || mode !== "edit") return;
    setEditName(s.name);
    setEditSector(s.sector ?? "");
    setEditIsin(s.isin ?? "");
    setEditStatus(s.status);
    setRefPrice(s.referencePrice != null ? String(s.referencePrice) : "");
  }, [detailQuery.data, mode]);

  useEffect(() => {
    if (items.length && !selectedId && mode === "edit") {
      setSelectedId(items[0]!.id);
    }
  }, [items, selectedId, mode]);

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    refPriceMutation.isPending;

  if (listQuery.isLoading) {
    return <AdminSplitPanelSkeleton />;
  }

  const onCreate = async () => {
    setFormError(null);
    const ref = createRefPrice.trim()
      ? Number.parseFloat(createRefPrice.replace(/,/g, ""))
      : null;
    try {
      const res = await createMutation.mutateAsync({
        ticker: createTicker.trim().toUpperCase(),
        name: createName.trim(),
        sector: createSector.trim() || null,
        referencePrice: ref,
        referenceCurrency: createCurrency.trim() || "ETB",
      });
      setMode("edit");
      setSelectedId(res.id);
      void listQuery.refetch();
    } catch (e) {
      setFormError(getApiErrorMessage(e));
    }
  };

  const onSaveMeta = async () => {
    if (!selectedId) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({
        id: selectedId,
        name: editName.trim(),
        sector: editSector.trim() || null,
        isin: editIsin.trim() || null,
        status: editStatus,
      });
      void detailQuery.refetch();
      void listQuery.refetch();
    } catch (e) {
      setFormError(getApiErrorMessage(e));
    }
  };

  const onSaveRefPrice = async () => {
    if (!selectedId) return;
    setFormError(null);
    const price = Number.parseFloat(refPrice.replace(/,/g, ""));
    if (!Number.isFinite(price) || price <= 0) {
      setFormError(t("errorRefPrice"));
      return;
    }
    try {
      await refPriceMutation.mutateAsync({
        id: selectedId,
        referencePrice: price,
        referenceCurrency: detailQuery.data?.referenceCurrency ?? "ETB",
      });
      void detailQuery.refetch();
      void listQuery.refetch();
    } catch (e) {
      setFormError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base">{t("catalogTitle")}</CardTitle>
            <CardDescription>
              {t("catalogCount", { count: items.length })}
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            className="gap-1"
            onClick={() => {
              setMode("create");
              setSelectedId(null);
              setFormError(null);
            }}
          >
            <Plus className="size-4" aria-hidden />
            {t("newSecurity")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
          >
            <option value="">{t("statusAll")}</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Delisted">Delisted</option>
          </select>
          <ul className="max-h-[420px] space-y-1 overflow-y-auto">
            {items.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setMode("edit");
                    setSelectedId(s.id);
                    setFormError(null);
                  }}
                  className={cn(
                    "hover:bg-muted w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    selectedId === s.id &&
                      mode === "edit" &&
                      "bg-muted font-medium",
                  )}
                >
                  <span className="font-mono">{s.ticker}</span>
                  <span className="text-muted-foreground mx-2">—</span>
                  {s.name}
                  <span className="text-muted-foreground ml-2 text-xs">
                    ({s.status})
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("emptyCatalog")}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            {mode === "create" ? t("createTitle") : t("editTitle")}
          </CardTitle>
          <CardDescription>
            {mode === "create" ? t("createDesc") : t("editDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          {mode === "create" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-ticker">{t("ticker")}</Label>
                <Input
                  id="c-ticker"
                  value={createTicker}
                  onChange={(e) => setCreateTicker(e.target.value)}
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="c-name">{t("name")}</Label>
                <Input
                  id="c-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-sector">{t("sector")}</Label>
                <Input
                  id="c-sector"
                  value={createSector}
                  onChange={(e) => setCreateSector(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-ref">{t("referencePrice")}</Label>
                <Input
                  id="c-ref"
                  inputMode="decimal"
                  value={createRefPrice}
                  onChange={(e) => setCreateRefPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-cur">{t("currency")}</Label>
                <Input
                  id="c-cur"
                  value={createCurrency}
                  onChange={(e) => setCreateCurrency(e.target.value)}
                />
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button
                  type="button"
                  disabled={busy || !createTicker.trim() || !createName.trim()}
                  onClick={() => void onCreate()}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {t("createSubmit")}
                </Button>
              </div>
            </div>
          ) : detailQuery.isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("loadingDetail")}
            </div>
          ) : detailQuery.data ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("ticker")}</Label>
                  <p className="font-mono text-sm font-semibold">
                    {detailQuery.data.ticker}
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="e-name">{t("name")}</Label>
                  <Input
                    id="e-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-sector">{t("sector")}</Label>
                  <Input
                    id="e-sector"
                    value={editSector}
                    onChange={(e) => setEditSector(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-isin">{t("isin")}</Label>
                  <Input
                    id="e-isin"
                    value={editIsin}
                    onChange={(e) => setEditIsin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-status">{t("status")}</Label>
                  <select
                    id="e-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Delisted">Delisted</option>
                  </select>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void onSaveMeta()}
              >
                {t("saveMetadata")}
              </Button>

              <div className="border-border space-y-3 border-t pt-4">
                <p className="text-sm font-semibold">
                  {t("referencePriceSection")}
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[160px] flex-1 space-y-2">
                    <Label htmlFor="e-ref">{t("referencePrice")}</Label>
                    <Input
                      id="e-ref"
                      inputMode="decimal"
                      value={refPrice}
                      onChange={(e) => setRefPrice(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void onSaveRefPrice()}
                  >
                    {t("updateRefPrice")}
                  </Button>
                </div>
                {detailQuery.data.referencePriceUpdatedAt ? (
                  <p className="text-muted-foreground text-xs">
                    {t("refUpdatedAt", {
                      date: new Date(
                        detailQuery.data.referencePriceUpdatedAt,
                      ).toLocaleString(),
                    })}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t("selectSecurity")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
