"use client";

import { useMemo, useState } from "react";
import { Mail, RefreshCw, ShieldAlert, UserPlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useAdminInvitations,
  useAdminUsers,
  useDeactivateAdmin,
  useInviteAdmin,
  useRevokeAdminInvitation,
  useTriggerAdminPasswordReset,
} from "@/features/admin/api/use-admin-users";
import type {
  AdminInvitationDto,
  AdminUserDto,
} from "@/shared/api/dtos/admin-users";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { isSuperAdminRole } from "@/shared/lib/user-role";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Modal } from "@/shared/ui/modal";

type Feedback =
  | { tone: "success"; message: string }
  | { tone: "error"; message: string }
  | null;

type ConfirmState =
  | {
      action: "revoke";
      id: string;
      title: string;
      description: string;
      confirmLabel: string;
    }
  | {
      action: "deactivate";
      id: string;
      title: string;
      description: string;
      confirmLabel: string;
    }
  | null;

const selectClassName =
  "h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30";

function formatDateTime(
  value: string | null | undefined,
  locale: string,
  fallback: string,
): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function getAdminUserKey(user: AdminUserDto): string {
  return (
    user.id ||
    user.userId ||
    user.email ||
    [user.fullName, user.createdAt, user.phone].filter(Boolean).join(":")
  );
}

function getAdminUserId(user: AdminUserDto): string {
  return user.id || user.userId || "";
}

function getInvitationId(invitation: AdminInvitationDto): string {
  return invitation.invitationId || invitation.id || "";
}

function getInvitationKey(invitation: AdminInvitationDto): string {
  return (
    invitation.invitationId ||
    invitation.id ||
    invitation.email ||
    [invitation.fullName, invitation.createdAt, invitation.expiresAt]
      .filter(Boolean)
      .join(":")
  );
}

function inferAdminActive(user: AdminUserDto): boolean {
  if (typeof user.isActive === "boolean") return user.isActive;
  if (user.deactivatedAt) return false;
  const status = (user.status ?? "").toLowerCase();
  if (status.includes("deactiv")) return false;
  if (status.includes("inactive")) return false;
  return true;
}

function inferInvitationState(
  invitation: AdminInvitationDto,
): "pending" | "accepted" | "revoked" | "expired" {
  const status = (invitation.status ?? "").toLowerCase();
  if (invitation.revokedAt || status.includes("revok")) return "revoked";
  if (invitation.acceptedAt || status.includes("accept")) return "accepted";
  if (invitation.expiresAt) {
    const expiresAt = new Date(invitation.expiresAt);
    if (
      !Number.isNaN(expiresAt.getTime()) &&
      expiresAt.getTime() < Date.now()
    ) {
      return "expired";
    }
  }
  if (status.includes("expir")) return "expired";
  return "pending";
}

function feedbackClasses(tone: "success" | "error"): string {
  return tone === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-destructive/30 bg-destructive/10 text-destructive";
}

function renderFeedback(feedback: Feedback) {
  if (!feedback) return null;
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${feedbackClasses(feedback.tone)}`}
      role={feedback.tone === "error" ? "alert" : "status"}
    >
      {feedback.message}
    </div>
  );
}

export function AdminUsersManagementScreen() {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const adminsQ = useAdminUsers();
  const invitationsQ = useAdminInvitations();
  const inviteAdmin = useInviteAdmin();
  const revokeInvitation = useRevokeAdminInvitation();
  const triggerPasswordReset = useTriggerAdminPasswordReset();
  const deactivateAdmin = useDeactivateAdmin();

  const [inviteForm, setInviteForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    preferredLang: "en",
  });
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const sortedAdmins = useMemo(
    () =>
      [...(adminsQ.data ?? [])].sort((a, b) => {
        const ad = new Date(a.createdAt ?? 0).getTime();
        const bd = new Date(b.createdAt ?? 0).getTime();
        return bd - ad;
      }),
    [adminsQ.data],
  );

  const sortedInvitations = useMemo(
    () =>
      [...(invitationsQ.data ?? [])].sort((a, b) => {
        const ad = new Date(a.invitedAt ?? a.createdAt ?? 0).getTime();
        const bd = new Date(b.invitedAt ?? b.createdAt ?? 0).getTime();
        return bd - ad;
      }),
    [invitationsQ.data],
  );

  const totalAdmins = sortedAdmins.length;
  const activeAdmins = sortedAdmins.filter(inferAdminActive).length;
  const pendingInvitations = sortedInvitations.filter(
    (invitation) => inferInvitationState(invitation) === "pending",
  ).length;

  const onInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    inviteAdmin.mutate(
      {
        email: inviteForm.email.trim(),
        fullName: inviteForm.fullName.trim(),
        phone: inviteForm.phone.trim() || null,
        preferredLang: inviteForm.preferredLang,
      },
      {
        onSuccess: (data) => {
          setInviteForm({
            email: "",
            fullName: "",
            phone: "",
            preferredLang: "en",
          });
          setFeedback({
            tone: "success",
            message: data.message || t("invite.success"),
          });
        },
        onError: (error) => {
          setFeedback({
            tone: "error",
            message: getApiErrorMessage(error),
          });
        },
      },
    );
  };

  const onResetPassword = (adminUserId: string) => {
    setFeedback(null);
    setResettingId(adminUserId);
    triggerPasswordReset.mutate(adminUserId, {
      onSuccess: (message) => {
        setFeedback({
          tone: "success",
          message: message || t("roster.resetSuccess"),
        });
      },
      onError: (error) => {
        setFeedback({
          tone: "error",
          message: getApiErrorMessage(error),
        });
      },
      onSettled: () => {
        setResettingId(null);
      },
    });
  };

  const onConfirmAction = () => {
    if (!confirmState) return;

    setFeedback(null);

    if (confirmState.action === "revoke") {
      revokeInvitation.mutate(confirmState.id, {
        onSuccess: (message) => {
          setFeedback({
            tone: "success",
            message: message || t("invitations.revokeSuccess"),
          });
          setConfirmState(null);
        },
        onError: (error) => {
          setFeedback({
            tone: "error",
            message: getApiErrorMessage(error),
          });
        },
      });
      return;
    }

    deactivateAdmin.mutate(confirmState.id, {
      onSuccess: (message) => {
        setFeedback({
          tone: "success",
          message: message || t("roster.deactivateSuccess"),
        });
        setConfirmState(null);
      },
      onError: (error) => {
        setFeedback({
          tone: "error",
          message: getApiErrorMessage(error),
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {renderFeedback(feedback)}

      <div className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("summary.totalAdmins")}</CardTitle>
            <CardDescription>{t("summary.totalAdminsHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {totalAdmins.toLocaleString(locale)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("summary.activeAdmins")}</CardTitle>
            <CardDescription>{t("summary.activeAdminsHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {activeAdmins.toLocaleString(locale)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("summary.pendingInvitations")}</CardTitle>
            <CardDescription>
              {t("summary.pendingInvitationsHint")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {pendingInvitations.toLocaleString(locale)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("invite.title")}</CardTitle>
              <CardDescription>{t("invite.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onInviteSubmit} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">{t("fields.email")}</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm((current) => ({
                        ...current,
                        email: e.target.value,
                      }))
                    }
                    placeholder={t("invite.emailPlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-full-name">
                    {t("fields.fullName")}
                  </Label>
                  <Input
                    id="invite-full-name"
                    value={inviteForm.fullName}
                    onChange={(e) =>
                      setInviteForm((current) => ({
                        ...current,
                        fullName: e.target.value,
                      }))
                    }
                    placeholder={t("invite.fullNamePlaceholder")}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invite-phone">{t("fields.phone")}</Label>
                    <Input
                      id="invite-phone"
                      value={inviteForm.phone}
                      onChange={(e) =>
                        setInviteForm((current) => ({
                          ...current,
                          phone: e.target.value,
                        }))
                      }
                      placeholder={t("invite.phonePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-lang">
                      {t("fields.preferredLang")}
                    </Label>
                    <select
                      id="invite-lang"
                      value={inviteForm.preferredLang}
                      onChange={(e) =>
                        setInviteForm((current) => ({
                          ...current,
                          preferredLang: e.target.value,
                        }))
                      }
                      className={selectClassName}
                    >
                      <option value="en">{t("languages.en")}</option>
                      <option value="am">{t("languages.am")}</option>
                    </select>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {t("invite.helper")}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={inviteAdmin.isPending}
                  >
                    <UserPlus className="size-4" aria-hidden />
                    {inviteAdmin.isPending
                      ? t("invite.submitting")
                      : t("invite.submit")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("invitations.title")}</CardTitle>
              <CardDescription>
                {t("invitations.description", {
                  count: sortedInvitations.length,
                })}
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void invitationsQ.refetch()}
                  disabled={invitationsQ.isFetching}
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                  {t("actions.refresh")}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {invitationsQ.isLoading ? (
                <p className="text-muted-foreground text-sm">
                  {tCommon("loading")}
                </p>
              ) : invitationsQ.isError ? (
                <p className="text-destructive text-sm" role="alert">
                  {getApiErrorMessage(invitationsQ.error)}
                </p>
              ) : sortedInvitations.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("invitations.empty")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {sortedInvitations.map((invitation) => {
                    const invitationId = getInvitationId(invitation);
                    const state = inferInvitationState(invitation);
                    const badgeVariant =
                      state === "pending"
                        ? "default"
                        : state === "accepted"
                          ? "secondary"
                          : "outline";
                    const canRevoke =
                      state === "pending" && invitationId.length > 0;

                    return (
                      <li
                        key={getInvitationKey(invitation)}
                        className="border-border rounded-lg border p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">
                                {normalizeOptionalText(invitation.fullName) ??
                                  t("fallbacks.noName")}
                              </p>
                              <Badge variant={badgeVariant}>
                                {t(`badges.invitation.${state}`)}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {normalizeOptionalText(invitation.email) ??
                                t("fallbacks.notAvailable")}
                            </p>
                            <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                              <p>
                                {t("invitations.sentAt")}:{" "}
                                {formatDateTime(
                                  invitation.invitedAt ?? invitation.createdAt,
                                  locale,
                                  t("fallbacks.notAvailable"),
                                )}
                              </p>
                              <p>
                                {t("invitations.expiresAt")}:{" "}
                                {formatDateTime(
                                  invitation.expiresAt,
                                  locale,
                                  t("fallbacks.notAvailable"),
                                )}
                              </p>
                              <p>
                                {t("fields.preferredLang")}:{" "}
                                {normalizeOptionalText(
                                  invitation.preferredLang,
                                ) ?? t("fallbacks.notAvailable")}
                              </p>
                              <p className="truncate">
                                {t("fields.phone")}:{" "}
                                {normalizeOptionalText(invitation.phone) ??
                                  t("fallbacks.notAvailable")}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={
                                !canRevoke || revokeInvitation.isPending
                              }
                              onClick={() =>
                                setConfirmState({
                                  action: "revoke",
                                  id: invitationId,
                                  title: t("confirm.revokeTitle"),
                                  description: t("confirm.revokeDescription", {
                                    email:
                                      normalizeOptionalText(invitation.email) ??
                                      t("fallbacks.notAvailable"),
                                  }),
                                  confirmLabel: t("actions.revoke"),
                                })
                              }
                            >
                              {t("actions.revoke")}
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("roster.title")}</CardTitle>
            <CardDescription>
              {t("roster.description", { count: sortedAdmins.length })}
            </CardDescription>
            <CardAction>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void adminsQ.refetch()}
                disabled={adminsQ.isFetching}
              >
                <RefreshCw className="size-3.5" aria-hidden />
                {t("actions.refresh")}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminsQ.isLoading ? (
              <p className="text-muted-foreground text-sm">
                {tCommon("loading")}
              </p>
            ) : adminsQ.isError ? (
              <p className="text-destructive text-sm" role="alert">
                {getApiErrorMessage(adminsQ.error)}
              </p>
            ) : sortedAdmins.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("roster.empty")}
              </p>
            ) : (
              <ul className="space-y-3">
                {sortedAdmins.map((user) => {
                  const adminUserId = getAdminUserId(user);
                  const isActive = inferAdminActive(user);
                  const displayName =
                    normalizeOptionalText(user.fullName) ??
                    normalizeOptionalText(user.email) ??
                    t("fallbacks.noName");
                  const roleText =
                    normalizeOptionalText(user.role) ??
                    (isSuperAdminRole(user.role) ? "SuperAdmin" : "Admin");

                  return (
                    <li
                      key={getAdminUserKey(user)}
                      className="border-border rounded-lg border p-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{displayName}</p>
                              <Badge
                                variant={isActive ? "secondary" : "outline"}
                              >
                                {isActive
                                  ? t("badges.admin.active")
                                  : t("badges.admin.inactive")}
                              </Badge>
                              <Badge variant="outline">{roleText}</Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {normalizeOptionalText(user.email) ??
                                t("fallbacks.notAvailable")}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={
                                adminUserId.length === 0 ||
                                resettingId === adminUserId
                              }
                              onClick={() => onResetPassword(adminUserId)}
                            >
                              <Mail className="size-3.5" aria-hidden />
                              {resettingId === adminUserId
                                ? t("roster.resetting")
                                : t("actions.resetPassword")}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={
                                adminUserId.length === 0 ||
                                !isActive ||
                                deactivateAdmin.isPending
                              }
                              onClick={() =>
                                setConfirmState({
                                  action: "deactivate",
                                  id: adminUserId,
                                  title: t("confirm.deactivateTitle"),
                                  description: t(
                                    "confirm.deactivateDescription",
                                    {
                                      name: displayName,
                                    },
                                  ),
                                  confirmLabel: t("actions.deactivate"),
                                })
                              }
                            >
                              <ShieldAlert className="size-3.5" aria-hidden />
                              {t("actions.deactivate")}
                            </Button>
                          </div>
                        </div>

                        <dl className="grid gap-x-4 gap-y-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                          <div>
                            <dt>{t("roster.memberSince")}</dt>
                            <dd className="mt-0.5 text-foreground">
                              {formatDateTime(
                                user.createdAt,
                                locale,
                                t("fallbacks.notAvailable"),
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt>{t("roster.lastSignIn")}</dt>
                            <dd className="mt-0.5 text-foreground">
                              {formatDateTime(
                                user.lastSignInAt,
                                locale,
                                t("fallbacks.notAvailable"),
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt>{t("fields.preferredLang")}</dt>
                            <dd className="mt-0.5 text-foreground">
                              {normalizeOptionalText(user.preferredLang) ??
                                t("fallbacks.notAvailable")}
                            </dd>
                          </div>
                          <div>
                            <dt>{t("fields.phone")}</dt>
                            <dd className="mt-0.5 text-foreground">
                              {normalizeOptionalText(user.phone) ??
                                t("fallbacks.notAvailable")}
                            </dd>
                          </div>
                          <div>
                            <dt>{t("roster.department")}</dt>
                            <dd className="mt-0.5 text-foreground">
                              {normalizeOptionalText(user.department) ??
                                t("fallbacks.notAvailable")}
                            </dd>
                          </div>
                          <div>
                            <dt>{t("roster.jobTitle")}</dt>
                            <dd className="mt-0.5 text-foreground">
                              {normalizeOptionalText(user.jobTitle) ??
                                t("fallbacks.notAvailable")}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={Boolean(confirmState)}
        onOpenChange={() => setConfirmState(null)}
      >
        {confirmState ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                {confirmState.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {confirmState.description}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmState(null)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={
                  revokeInvitation.isPending || deactivateAdmin.isPending
                }
                onClick={onConfirmAction}
              >
                {confirmState.confirmLabel}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
