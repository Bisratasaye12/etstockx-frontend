/**
 * Short-lived handoff between `/login` and `/login/mfa` after the API rejects
 * password-only login with an MFA-required style error. Backend MFA is TOTP
 * only (see OpenAPI `POST /auth/login` and `/auth/mfa/*`).
 */
const STORAGE_KEY = "etstockx:login-mfa-pending";
export const LOGIN_MFA_PENDING_TTL_MS = 10 * 60 * 1000;

export type LoginMfaPendingPayload = {
  email: string;
  password: string;
  at: number;
};

export function writeLoginMfaPending(
  data: Pick<LoginMfaPendingPayload, "email" | "password">,
) {
  if (typeof sessionStorage === "undefined") return;
  const payload: LoginMfaPendingPayload = {
    ...data,
    at: Date.now(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function readLoginMfaPending(): LoginMfaPendingPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LoginMfaPendingPayload;
    if (
      typeof parsed.email !== "string" ||
      typeof parsed.password !== "string" ||
      typeof parsed.at !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLoginMfaPending() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isLoginMfaPendingFresh(
  p: LoginMfaPendingPayload,
  now = Date.now(),
) {
  return now - p.at <= LOGIN_MFA_PENDING_TTL_MS;
}
