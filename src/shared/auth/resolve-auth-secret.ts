/**
 * Same value NextAuth `secret` and `getToken({ secret })` must use so JWTs verify everywhere.
 */
let cachedSecret: string | undefined;

export function resolveAuthSecret(): string {
  if (cachedSecret !== undefined) return cachedSecret;

  const fromEnv = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (fromEnv) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[auth] AUTH_SECRET / NEXTAUTH_SECRET not set. Using an insecure dev fallback. Add AUTH_SECRET (32+ chars) to .env.local.",
    );
    cachedSecret = "dev-only-insecure-auth-secret-min-32-chars-long!!";
    return cachedSecret;
  }
  throw new Error(
    "Set AUTH_SECRET or NEXTAUTH_SECRET in the environment before starting the app in production.",
  );
}
