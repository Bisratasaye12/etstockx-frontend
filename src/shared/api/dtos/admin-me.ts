/**
 * GET /api/v1/admin/me (planned) — read-only admin operator profile for the portal.
 * Extend this interface when the backend contract is finalized; optional fields stay safe until then.
 */
export interface AdminMeDto {
  userId?: string;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  preferredLang?: string | null;
  /** ISO 8601 */
  createdAt?: string | null;
  /** ISO 8601 */
  lastSignInAt?: string | null;
  department?: string | null;
  jobTitle?: string | null;
}
