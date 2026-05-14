/**
 * IAM API contracts — JSON camelCase, aligned with OpenAPI **v1** (`components/schemas/*`).
 * Spec: `{API_URL}/swagger/v1/swagger.json` (e.g. `http://localhost:8080/swagger/v1/swagger.json`).
 * @see AuthController route prefix `api/v1/auth`
 */

export type UserRole = "Client" | "Broker" | "Dealer" | "Admin";

// ─── POST /api/v1/auth/login ─────────────────────────────────────────────

/** Request body — matches `LoginRequest` in AuthController. */
export interface LoginRequestDto {
  email: string;
  password: string;
  otpCode: string | null;
}

/**
 * 200 OK — `LoginResultDto` in OpenAPI.
 * Several string fields are marked nullable in the spec (C# reference types); a successful login still returns tokens.
 */
export interface LoginResultDto {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  /** GUID string */
  userId: string;
  isActivated: boolean;
}

// ─── POST /api/v1/auth/refresh-token ────────────────────────────────────

/** Request body — matches `RefreshTokenRequest`. */
export interface RefreshTokenRequestDto {
  refreshToken: string;
}

/** 200 OK — `TokenRefreshResultDto` in OpenAPI. */
export interface TokenRefreshResultDto {
  accessToken: string | null;
  refreshToken: string | null;
}

// ─── POST /api/v1/auth/register ─────────────────────────────────────────

/** Request body — matches `RegisterUserCommand`. */
export interface RegisterUserRequestDto {
  role: UserRole;
  email: string;
  password: string;
  fullName: string;
  phone: string | null;
  preferredLang: string;
  licenseNumber: string | null;
  institution: string | null;
  ecmaReference: string | null;
}

/** 201 Created — `{ userId, message }` from `AuthController.Register`. */
export interface RegisterCreatedResponseDto {
  userId: string;
  message: string;
}

/**
 * Multipart field names for `POST /api/v1/auth/register/broker`.
 * Note: backend currently expects PascalCase form keys.
 */
export interface RegisterBrokerMultipartRequestDto {
  Role: "Broker" | "Dealer";
  Email: string;
  Password: string;
  FullName: string;
  Phone: string;
  PreferredLang: string;
  LicenseNumber: string;
  Institution: string;
  EcmaReference: string;
  Documents: File[];
  DocumentTypes?: string[];
}

// ─── POST /api/v1/auth/resend-verification ──────────────────────────────

export interface ResendVerificationRequestDto {
  email: string;
}

// ─── POST /api/v1/auth/change-password ──────────────────────────────────

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

// ─── POST /api/v1/auth/reset-password ───────────────────────────────────

/** Body — matches `ResetPasswordRequest` in OpenAPI. */
export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}

// ─── POST /api/v1/auth/mfa/enable | mfa/confirm | mfa/disable ────────────
/** TOTP (authenticator app) only in OpenAPI v1; login uses `LoginRequestDto.otpCode` with the same 6-digit codes. */

export interface MfaPasswordRequestDto {
  password: string;
}

/** 200 OK from `mfa/enable` — `{ secret }`. Enrollment stays pending until `mfa/confirm`. */
export interface MfaEnableResponseDto {
  secret: string;
}

/** Body — `MfaConfirmRequest` in OpenAPI. Activates MFA after `mfa/enable`. */
export interface MfaConfirmRequestDto {
  otpCode: string | null;
}

// ─── GET /api/v1/auth/sessions ──────────────────────────────────────────

/** Matches `SessionDto`. */
export interface SessionDto {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

// ─── Admin: brokers ──────────────────────────────────────────────────────

/** `BrokerDocumentDto` in OpenAPI. */
export interface BrokerDocumentDto {
  id: string;
  fileName: string | null;
  documentType: string | null;
  uploadedAt: string;
}

/** `BrokerApplicationDto` in OpenAPI. */
export interface BrokerApplicationDto {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  licenseNumber: string | null;
  institution: string | null;
  ecmaReference: string | null;
  status: string | null;
  decisionReason: string | null;
  submittedAt: string;
  documents: BrokerDocumentDto[] | null;
}

/** POST `/brokers/{applicationId}/verify` — `VerifyBrokerRequest` in OpenAPI. */
export interface VerifyBrokerRequestDto {
  decision: string | null;
  reason: string | null;
}

// ─── Error / message envelopes ──────────────────────────────────────────

export interface ApiErrorBody {
  error?: string;
}

export interface MessageResponseDto {
  message: string;
}
