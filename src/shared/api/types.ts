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
  ApiErrorBody,
  SessionDto,
  BrokerDocumentDto,
  BrokerApplicationDto,
  VerifyBrokerRequestDto,
} from "./dtos/iam";

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

export interface BrokerDirectoryEntry {
  userId: string;
  institution: string | null;
  licenseDisplay: string | null;
  isAcceptingRequests: boolean;
}

export interface WatchlistItem {
  id: string;
  listingId: string;
  displayOrder: number;
  createdAt: string;
}
