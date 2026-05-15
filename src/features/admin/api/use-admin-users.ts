import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type {
  AdminInvitationDto,
  AdminUserDto,
  InviteAdminRequestDto,
  InviteAdminResponseDto,
} from "@/shared/api/dtos/admin-users";

export const adminUserKeys = {
  all: ["admin", "users"] as const,
  admins: ["admin", "users", "list"] as const,
  invitations: ["admin", "users", "invitations"] as const,
};

export function useAdminUsers() {
  return useQuery({
    queryKey: adminUserKeys.admins,
    queryFn: async () => {
      const { data } = await browserApi.get<AdminUserDto[]>("/v1/admin/users");
      return data ?? [];
    },
  });
}

export function useAdminInvitations() {
  return useQuery({
    queryKey: adminUserKeys.invitations,
    queryFn: async () => {
      const { data } = await browserApi.get<AdminInvitationDto[]>(
        "/v1/admin/users/invitations",
      );
      return data ?? [];
    },
  });
}

export function useInviteAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: InviteAdminRequestDto) => {
      const { data } = await browserApi.post<InviteAdminResponseDto>(
        "/v1/admin/users/invitations",
        body,
      );
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminUserKeys.invitations });
    },
  });
}

export function useRevokeAdminInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data } = await browserApi.delete<{ message?: string }>(
        `/v1/admin/users/invitations/${invitationId}`,
      );
      return data?.message ?? "Invitation revoked.";
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminUserKeys.invitations });
    },
  });
}

export function useTriggerAdminPasswordReset() {
  return useMutation({
    mutationFn: async (adminUserId: string) => {
      const { data } = await browserApi.post<{ message?: string }>(
        `/v1/admin/users/${adminUserId}/reset-password`,
      );
      return data?.message ?? "Password reset email sent.";
    },
  });
}

export function useDeactivateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (adminUserId: string) => {
      const { data } = await browserApi.post<{ message?: string }>(
        `/v1/admin/users/${adminUserId}/deactivate`,
      );
      return data?.message ?? "Admin deactivated.";
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminUserKeys.admins });
    },
  });
}
