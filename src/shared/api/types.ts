/** Mirrors EtStockX.Api JSON (camelCase). */

export type UserRole = "Client" | "Broker" | "Dealer" | "Admin";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  userId: string;
  isActivated: boolean;
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorBody {
  error?: string;
}

export interface RegisterPayload {
  role: UserRole;
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  preferredLang: string;
  licenseNumber?: string | null;
  institution?: string | null;
  ecmaReference?: string | null;
}

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

export interface UserSession {
  sessionId: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastActivityAt: string;
}

export interface BrokerDocument {
  id: string;
  fileName: string;
  documentType: string | null;
  uploadedAt: string;
}

export interface BrokerApplication {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  licenseNumber: string;
  institution: string | null;
  ecmaReference: string | null;
  status: string;
  decisionReason: string | null;
  submittedAt: string;
  documents: BrokerDocument[];
}
