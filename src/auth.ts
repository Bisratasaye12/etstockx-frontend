import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { User } from "next-auth";
import { getServerApiBaseUrl } from "@/shared/config/env";
import type { LoginResultDto } from "@/shared/api/dtos/iam";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
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
        if (!credentials?.email || !credentials?.password) return null;

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

        const data = (await res.json()) as LoginResultDto & { error?: string };
        if (!res.ok || !data.accessToken || !data.refreshToken) return null;

        return {
          id: data.userId,
          email: credentials.email as string,
          role: data.role ?? "Client",
          isActivated: data.isActivated,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        } as User & {
          role: string;
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
          isActivated: boolean;
        };
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.role = u.role;
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
        session.user.role = (token.role as string) ?? "";
        session.user.isActivated = Boolean(token.isActivated);
        session.accessToken = token.accessToken as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
});
