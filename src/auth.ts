import NextAuth from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { User } from "next-auth";
import { getServerApiBaseUrl } from "@/shared/config/env";
import { resolveAuthSecret } from "@/shared/auth/resolve-auth-secret";
import type { LoginResultDto } from "@/shared/api/dtos/iam";
import { normalizeUserRole } from "@/shared/lib/user-role";

class BackendCredentialsSignin extends CredentialsSignin {
  code: string;

  constructor(code: string) {
    super();
    this.code = code;
  }
}

function mapBackendLoginErrorToCode(message?: string): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("pending verification")) return "pending_verification";
  if (m.includes("verify your email")) return "email_not_verified";
  if (m.includes("temporarily locked")) return "account_locked";
  if (m.includes("rejected")) return "account_rejected";
  if (m.includes("mfa code is required")) return "mfa_required";
  if (m.includes("invalid mfa code")) return "mfa_invalid";
  return "invalid_credentials";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otpCode: { label: "OTP", type: "text" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new BackendCredentialsSignin("invalid_credentials");
        }

        const apiUrl = getServerApiBaseUrl();
        const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            otpCode: credentials.otpCode || null,
          }),
        });

        const raw = await res.text();
        let data = {} as LoginResultDto & { error?: string };
        if (raw) {
          try {
            data = JSON.parse(raw) as LoginResultDto & { error?: string };
          } catch {
            throw new BackendCredentialsSignin("invalid_credentials");
          }
        }

        if (!res.ok || !data.accessToken || !data.refreshToken) {
          throw new BackendCredentialsSignin(
            mapBackendLoginErrorToCode(data.error),
          );
        }

        return {
          id: data.userId,
          email: credentials.email as string,
          role: normalizeUserRole(data.role) ?? "Client",
          rawRole: data.role ?? undefined,
          isActivated: data.isActivated,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        } as User & {
          role: string;
          rawRole?: string;
          isActivated: boolean;
          accessToken: string;
          refreshToken: string;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as User & {
          accessToken: string;
          refreshToken: string;
          role: string;
          rawRole?: string;
          isActivated: boolean;
        };
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.role = normalizeUserRole(u.role) ?? "Client";
        token.rawRole = u.rawRole ?? u.role;
        token.isActivated = u.isActivated;
        token.sub = u.id;
        if (u.email) token.email = u.email;
      }
      if (trigger === "update" && session) {
        if (typeof session.accessToken === "string")
          token.accessToken = session.accessToken;
        if (typeof session.refreshToken === "string")
          token.refreshToken = session.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = normalizeUserRole(token.role as string) ?? "Client";
        session.user.rawRole =
          typeof token.rawRole === "string" ? token.rawRole : undefined;
        session.user.isActivated = Boolean(token.isActivated);
        session.accessToken = token.accessToken as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
});
