/**
 * Shared API shapes. IAM types live in `./dtos/iam` and are re-exported here for compatibility.
 */

export type {
  UserRole,
  LoginRequestDto,
  LoginResultDto,
  TokenRefreshResultDto,
  RefreshTokenRequestDto,
  RegisterUserRequestDto,
  RegisterCreatedResponseDto,
  AcceptAdminInvitationRequestDto,
  ApiErrorBody,
  SessionDto,
  BrokerDocumentDto,
  BrokerApplicationDto,
  VerifyBrokerRequestDto,
} from "./dtos/iam";
export type {
  AdminUserDto,
  AdminInvitationDto,
  InviteAdminRequestDto,
  InviteAdminResponseDto,
} from "./dtos/admin-users";

/** @deprecated Use `LoginResultDto` — kept for existing imports. */
export type { LoginResultDto as LoginResult } from "./dtos/iam";

/** @deprecated Use `TokenRefreshResultDto`. */
export type { TokenRefreshResultDto as TokenRefreshResult } from "./dtos/iam";

/** @deprecated Use `RegisterUserRequestDto`. */
export type { RegisterUserRequestDto as RegisterPayload } from "./dtos/iam";

/** @deprecated Use `BrokerApplicationDto`. */
export type { BrokerApplicationDto as BrokerApplication } from "./dtos/iam";

/** @deprecated Use `BrokerDocumentDto`. */
export type { BrokerDocumentDto as BrokerDocument } from "./dtos/iam";

export interface ClientProfile {
  userId: string;
  riskProfile: string | null;
  kycStatus: string;
  preferredLang: string;
  address: string | null;
  contactPerson: string | null;
  settlementBank: string | null;
  accountNickname: string | null;
  isProfileComplete: boolean;
  profileCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrokerProfile {
  userId: string;
  institution: string | null;
  bio: string | null;
  licenseDisplay: string | null;
  logoPath: string | null;
  specializations: string[];
  isAcceptingRequests: boolean;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/v1/profiles/admin/me */
export interface AdminProfile {
  userId: string;
  preferredLang: string | null;
  department: string | null;
  jobTitle: string | null;
  avatarPath: string | null;
  createdAt: string;
  updatedAt: string;
}

/** PUT /api/v1/profiles/admin/me */
export interface UpdateAdminProfileRequest {
  department?: string | null;
  jobTitle?: string | null;
  avatarPath?: string | null;
  preferredLang?: string | null;
}

export interface BrokerDirectoryEntry {
  userId: string;
  /** When the API joins IAM display name into the directory payload (camelCase). */
  fullName?: string | null;
  institution: string | null;
  bio: string | null;
  licenseDisplay: string | null;
  specializations: string[];
  isAcceptingRequests: boolean;
  /** Optional public contact fields when the API exposes them. */
  publicEmail?: string | null;
  publicOfficeLocation?: string | null;
  publicLanguages?: string | null;
}

export interface WatchlistItem {
  id: string;
  listingId: string;
  displayOrder: number;
  /** API field (OpenAPI `addedAt`). */
  addedAt: string;
}
