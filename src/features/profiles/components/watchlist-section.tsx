"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import { useWatchlist } from "@/features/profiles/api/use-watchlist";
import { profileKeys } from "@/features/profiles/api/keys";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { getApiErrorMessage } from "@/shared/lib/api-error";

export function WatchlistSection() {
  const t = useTranslations("profile");
  const { data, isLoading } = useWatchlist();
  const qc = useQueryClient();
  const [listingId, setListingId] = useState("");

  const addMutation = useMutation({
    mutationFn: async (id: string) => {
      await browserApi.post("/v1/profiles/client/watchlist", {
        listingId: id,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.watchlist() });
      setListingId("");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await browserApi.delete(`/v1/profiles/client/watchlist/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.watchlist() });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("watchlist")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="listing">{t("listingId")}</Label>
            <Input
              id="listing"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => addMutation.mutate(listingId.trim())}
              disabled={!listingId.trim() || addMutation.isPending}
            >
              {t("addListing")}
            </Button>
          </div>
        </div>
        {addMutation.isError ? (
          <p className="text-destructive text-sm">
            {getApiErrorMessage(addMutation.error)}
          </p>
        ) : null}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">…</p>
        ) : (
          <ul className="space-y-2">
            {(data ?? []).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 border-b py-2 text-sm"
              >
                <span className="font-mono text-xs">{item.listingId}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMutation.mutate(item.listingId)}
                  disabled={removeMutation.isPending}
                >
                  {t("remove")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
