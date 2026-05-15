/**
 * Super Admin management API contracts.
 * Routes: `api/v1/admin/users*` (proxied as `/api/backend/v1/admin/users*`).
 */

export interface AdminUserDto {
  id: string;
  userId?: string | null;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  preferredLang: string | null;
  role: string | null;
  status: string | null;
  isActive: boolean | null;
  department?: string | null;
  jobTitle?: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  deactivatedAt?: string | null;
}

export interface AdminInvitationDto {
  id?: string | null;
  invitationId?: string | null;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  preferredLang: string | null;
  status: string | null;
  invitedAt?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  invitedByEmail?: string | null;
}

export interface InviteAdminRequestDto {
  email: string;
  fullName: string;
  phone: string | null;
  preferredLang: string;
}

export interface InviteAdminResponseDto {
  invitationId: string;
  message: string;
}
