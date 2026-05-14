"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Laptop, Smartphone } from "lucide-react";
import {
  useBrokerSessions,
  useRevokeBrokerSession,
} from "@/features/broker/api/use-broker-sessions";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { cn } from "@/shared/lib/utils";

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

type SessionVm = {
  id: string;
  deviceLabel: string;
  ipAddress: string;
  signedInAgo: string;
  expiresAt: string;
};

function safeDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRelative(
  iso: string,
  t: ReturnType<typeof useTranslations<"investor.profileSecurity.sessions">>,
) {
  const d = safeDate(iso);
  if (!d) return t("unknownTime");
  const diffMs = Date.now() - d.getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("daysAgo", { count: days });
}

function formatDate(iso: string) {
  const d = safeDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toSessionVm(
  s: {
    id: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    createdAt: string;
    expiresAt: string;
  },
  t: ReturnType<typeof useTranslations<"investor.profileSecurity.sessions">>,
  hydrateSafe: boolean,
): SessionVm {
  return {
    id: s.id,
    deviceLabel: (s.deviceInfo ?? "").trim() || t("unknownDevice"),
    ipAddress: s.ipAddress ?? "—",
    signedInAgo: hydrateSafe
      ? t("unknownTime")
      : formatRelative(s.createdAt, t),
    expiresAt: hydrateSafe ? "—" : formatDate(s.expiresAt),
  };
}

function deviceIcon(device: string) {
  const d = device.toLowerCase();
  if (d.includes("iphone") || d.includes("android") || d.includes("mobile")) {
    return Smartphone;
  }
  return Laptop;
}

function SessionRow({
  session,
  current,
  onRevoke,
  revoking,
  t,
}: {
  session: SessionVm;
  current?: boolean;
  onRevoke?: () => void;
  revoking: boolean;
  t: ReturnType<typeof useTranslations<"investor.profileSecurity.sessions">>;
}) {
  const Icon = deviceIcon(session.deviceLabel);
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-4 sm:px-5",
        current ? "border-primary/35 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold tracking-tight">
                {session.deviceLabel}
              </p>
              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                <span>{t("ip", { value: session.ipAddress })}</span>
                <span>{t("signedIn", { value: session.signedInAgo })}</span>
                <span>{t("expires", { value: session.expiresAt })}</span>
              </div>
            </div>
            {current ? (
              <span className="bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                {t("currentTag")}
              </span>
            ) : null}
          </div>
        </div>
        {!current ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRevoke}
            disabled={revoking}
            className="shrink-0"
          >
            {revoking ? t("revoking") : t("revoke")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function InvestorActiveSessionsScreen() {
  const t = useTranslations("investor.profileSecurity.sessions");
  const sessionsQ = useBrokerSessions();
  const revokeOne = useRevokeBrokerSession();
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { current, others } = useMemo(() => {
    const active = (sessionsQ.data ?? []).filter((s) => !s.isRevoked);
    const sorted = [...active].sort((a, b) => {
      const ad = safeDate(a.createdAt)?.getTime() ?? 0;
      const bd = safeDate(b.createdAt)?.getTime() ?? 0;
      return bd - ad;
    });
    const [currentRaw, ...othersRaw] = sorted;
    return {
      current: currentRaw ? toSessionVm(currentRaw, t, !mounted) : null,
      others: othersRaw.map((s) => toSessionVm(s, t, !mounted)),
    };
  }, [mounted, sessionsQ.data, t]);

  async function revokeOtherSessions() {
    if (others.length === 0) {
      setRevokeAllOpen(false);
      return;
    }
    try {
      setBanner(null);
      await Promise.all(others.map((s) => revokeOne.mutateAsync(s.id)));
      setBanner(t("revokeAllSuccess"));
      setRevokeAllOpen(false);
    } catch (e) {
      setBanner(getApiErrorMessage(e));
    }
  }

  async function revokeSingleSession(id: string) {
    try {
      setBanner(null);
      await revokeOne.mutateAsync(id);
      setBanner(t("revokeOneSuccess"));
    } catch (e) {
      setBanner(getApiErrorMessage(e));
    }
  }

  if (sessionsQ.isLoading) {
    return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  }

  if (sessionsQ.isError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {getApiErrorMessage(sessionsQ.error)}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          disabled={others.length === 0 || revokeOne.isPending}
          onClick={() => setRevokeAllOpen(true)}
        >
          {t("revokeAll")}
        </Button>
      </div>

      {banner ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {banner}
        </p>
      ) : null}

      <section className="space-y-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("currentSection")}
        </p>
        {current ? (
          <SessionRow
            session={current}
            current
            revoking={revokeOne.isPending}
            t={t}
          />
        ) : (
          <div
            className={cn(
              panelSurface,
              "px-4 py-6 text-sm text-muted-foreground",
            )}
          >
            {t("noCurrent")}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("otherSection")}
        </p>
        {others.length === 0 ? (
          <div
            className={cn(
              panelSurface,
              "px-4 py-6 text-sm text-muted-foreground",
            )}
          >
            {t("noOthers")}
          </div>
        ) : (
          <div className="space-y-3">
            {others.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onRevoke={() => void revokeSingleSession(session.id)}
                revoking={revokeOne.isPending}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <p className="font-semibold">{t("securityTitle")}</p>
        <p className="mt-1">{t("securityBody")}</p>
      </div>

      <Modal open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
        <div className="space-y-5 text-center">
          <div className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full">
            <AlertTriangle className="size-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t("confirmTitle")}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {t("confirmBody")}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokeAllOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void revokeOtherSessions()}
              disabled={revokeOne.isPending}
            >
              {revokeOne.isPending ? t("revoking") : t("confirmAction")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
