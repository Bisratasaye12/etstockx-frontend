"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  ChevronRight,
  Lock,
  Mail,
  Smartphone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  NotificationPreference,
  NotificationPreferenceChannel,
  UpdateNotificationPreferenceItem,
} from "@/entities/notification/model/types";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useNotificationPreferences } from "@/features/notifications/api/use-notification-preferences";
import { useUpdateNotificationPreferences } from "@/features/notifications/api/use-update-notification-preferences";
import {
  buildDefaultPreferenceDraft,
  sortNotificationPreferences,
} from "@/features/notifications/lib/notification-preference-defaults";

const panelSurface =
  "rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

const KNOWN_EVENT_TYPES = [
  "Welcome",
  "BuyRequestReceived",
  "SellRequestReceived",
  "ProposalSent",
  "TermsAgreed",
  "OrderStatusChanged",
  "MessageReceived",
  "BrokerVerified",
  "ListingModerated",
  "Security",
] as const;

type KnownEventType = (typeof KNOWN_EVENT_TYPES)[number];

const CHANNEL_COLUMNS: {
  key: NotificationPreferenceChannel;
  icon: typeof Bell;
  summaryKey: "inApp" | "email" | "sms" | "push";
  channelLabelKey: "inApp" | "email" | "sms" | "push";
}[] = [
  {
    key: "inAppEnabled",
    icon: Bell,
    summaryKey: "inApp",
    channelLabelKey: "inApp",
  },
  {
    key: "emailEnabled",
    icon: Mail,
    summaryKey: "email",
    channelLabelKey: "email",
  },
  {
    key: "smsEnabled",
    icon: Smartphone,
    summaryKey: "sms",
    channelLabelKey: "sms",
  },
  {
    key: "pushEnabled",
    icon: BellRing,
    summaryKey: "push",
    channelLabelKey: "push",
  },
];

function isKnownEventType(value: string): value is KnownEventType {
  return (KNOWN_EVENT_TYPES as readonly string[]).includes(value);
}

function preferencesEqual(
  a: NotificationPreference[],
  b: NotificationPreference[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((row, index) => {
    const other = b[index];
    return (
      row.eventType === other.eventType &&
      row.inAppEnabled === other.inAppEnabled &&
      row.emailEnabled === other.emailEnabled &&
      row.smsEnabled === other.smsEnabled &&
      row.pushEnabled === other.pushEnabled
    );
  });
}

function PreferenceChannelToggle({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "mx-auto flex size-5 items-center justify-center rounded-full border-2 transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:border-primary/40",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {checked ? <Check className="size-3 stroke-[3]" aria-hidden /> : null}
    </button>
  );
}

export function NotificationPreferencesScreen() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");

  const query = useNotificationPreferences();
  const saveMutation = useUpdateNotificationPreferences();

  const serverRows = useMemo(
    () => sortNotificationPreferences(query.data ?? []),
    [query.data],
  );

  const [draft, setDraft] = useState<NotificationPreference[]>([]);
  const [baseline, setBaseline] = useState<NotificationPreference[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isDirty = useMemo(
    () => baseline.length > 0 && !preferencesEqual(draft, baseline),
    [draft, baseline],
  );

  // Hydrate from the server only when there are no unsaved local edits.
  useEffect(() => {
    if (serverRows.length === 0 || isDirty) return;
    setDraft(serverRows);
    setBaseline(serverRows);
  }, [serverRows, isDirty]);

  function eventLabel(eventType: string | null): string {
    const key = (eventType ?? "").trim();
    if (!key) return t("preferences.events.unknown");
    if (isKnownEventType(key)) return t(`preferences.events.${key}`);
    return key;
  }

  function eventDescription(eventType: string | null): string {
    const key = (eventType ?? "").trim();
    if (!isKnownEventType(key)) return "";
    return t(`preferences.eventDescriptions.${key}`);
  }

  function channelLabel(channelLabelKey: "inApp" | "email" | "sms" | "push") {
    return t(`channels.${channelLabelKey}`);
  }

  function updateChannel(
    eventType: string,
    channel: NotificationPreferenceChannel,
    enabled: boolean,
  ) {
    setSaveSuccess(false);
    setDraft((prev) =>
      prev.map((row) => {
        if (row.eventType !== eventType || row.isMandatory) return row;
        return { ...row, [channel]: enabled };
      }),
    );
  }

  function handleReset() {
    setSaveSuccess(false);
    setDraft(buildDefaultPreferenceDraft(serverRows));
  }

  function handleSave() {
    setSaveSuccess(false);
    const preferences: UpdateNotificationPreferenceItem[] = draft
      .filter((row): row is NotificationPreference & { eventType: string } =>
        Boolean(row.eventType),
      )
      .map((row) => ({
        eventType: row.eventType,
        inAppEnabled: row.inAppEnabled,
        emailEnabled: row.emailEnabled,
        smsEnabled: row.smsEnabled,
        pushEnabled: row.pushEnabled,
      }));

    saveMutation.mutate(
      { preferences },
      {
        onSuccess: () => {
          setBaseline(draft);
          setSaveSuccess(true);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
          {t("preferences.title")}
        </h2>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          {t("preferences.subtitle")}
        </p>
      </div>

      <div
        className={cn(
          panelSurface,
          "grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5",
        )}
      >
        {CHANNEL_COLUMNS.map(({ icon: Icon, summaryKey }) => (
          <div
            key={summaryKey}
            className="border-border/80 flex items-start gap-3 rounded-lg border bg-muted/20 p-3"
          >
            <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-foreground text-sm font-semibold">
                {t(`preferences.channelSummary.${summaryKey}.title`)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                {t(`preferences.channelSummary.${summaryKey}.description`)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {query.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(query.error)}
        </p>
      ) : null}

      {saveMutation.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {getApiErrorMessage(saveMutation.error)}
        </p>
      ) : null}

      {saveSuccess ? (
        <p className="text-emerald-700 text-sm" role="status">
          {t("preferences.saveSuccess")}
        </p>
      ) : null}

      <div className={panelSurface}>
        <div className="border-border hidden border-b px-4 py-3 md:grid md:grid-cols-[minmax(0,1fr)_repeat(4,3.5rem)_2rem] md:items-center md:gap-2 md:px-6">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t("preferences.table.eventColumn")}
          </span>
          {CHANNEL_COLUMNS.map(({ key, icon: Icon, channelLabelKey }) => (
            <span
              key={key}
              className="text-muted-foreground flex flex-col items-center gap-1 text-center"
            >
              <Icon className="size-4" aria-hidden />
              <span className="text-[10px] font-semibold tracking-wide uppercase">
                {channelLabel(channelLabelKey)}
              </span>
            </span>
          ))}
          <span className="sr-only">
            {t("preferences.table.mandatoryColumn")}
          </span>
        </div>

        {query.isLoading ? (
          <p className="text-muted-foreground px-6 py-10 text-sm">
            {t("preferences.loading")}
          </p>
        ) : draft.length === 0 ? (
          <p className="text-muted-foreground px-6 py-10 text-sm">
            {t("preferences.empty")}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {draft.map((row) => {
              const eventType = row.eventType ?? "";
              return (
                <div
                  key={eventType}
                  className="px-4 py-4 md:grid md:grid-cols-[minmax(0,1fr)_repeat(4,3.5rem)_2rem] md:items-center md:gap-2 md:px-6"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-foreground text-sm font-semibold">
                      {eventLabel(row.eventType)}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {eventDescription(row.eventType)}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 md:hidden">
                      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        {t("preferences.table.channelsMobile")}
                      </span>
                      {row.isMandatory ? (
                        <Lock
                          className="text-muted-foreground size-4 shrink-0"
                          aria-label={t("preferences.mandatoryAria")}
                        />
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 md:hidden">
                      {CHANNEL_COLUMNS.map(({ key, channelLabelKey }) => (
                        <label
                          key={key}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <span className="text-muted-foreground text-[10px] font-medium">
                            {channelLabel(channelLabelKey)}
                          </span>
                          <PreferenceChannelToggle
                            checked={row[key]}
                            disabled={row.isMandatory}
                            label={t("preferences.toggleAria", {
                              event: eventLabel(row.eventType),
                              channel: channelLabel(channelLabelKey),
                            })}
                            onToggle={() =>
                              updateChannel(eventType, key, !row[key])
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="hidden md:contents">
                    {CHANNEL_COLUMNS.map(({ key, channelLabelKey }) => (
                      <PreferenceChannelToggle
                        key={key}
                        checked={row[key]}
                        disabled={row.isMandatory}
                        label={t("preferences.toggleAria", {
                          event: eventLabel(row.eventType),
                          channel: channelLabel(channelLabelKey),
                        })}
                        onToggle={() =>
                          updateChannel(eventType, key, !row[key])
                        }
                      />
                    ))}
                    <span className="flex justify-center">
                      {row.isMandatory ? (
                        <Lock
                          className="text-muted-foreground size-4"
                          aria-label={t("preferences.mandatoryAria")}
                        />
                      ) : (
                        <span className="size-4" aria-hidden />
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={query.isLoading || draft.length === 0}
          onClick={handleReset}
        >
          {t("preferences.reset")}
        </Button>
        <Button
          type="button"
          disabled={
            !isDirty ||
            saveMutation.isPending ||
            query.isLoading ||
            draft.length === 0
          }
          onClick={handleSave}
        >
          {saveMutation.isPending ? tc("loading") : t("preferences.save")}
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
