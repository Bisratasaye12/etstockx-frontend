import { Suspense } from "react";
import { AuthLoginFooter } from "@/features/auth/components/auth-login-footer";
import { MfaChallengeScreen } from "@/features/auth/components/mfa-challenge-screen";

export default function LoginMfaTotpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense
        fallback={
          <div className="text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm">
            …
          </div>
        }
      >
        <MfaChallengeScreen />
      </Suspense>
      <AuthLoginFooter />
    </div>
  );
}
