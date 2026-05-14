import { InvestorProfileChrome } from "@/features/profiles/components/investor-profile-chrome";

export default function ClientProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InvestorProfileChrome>{children}</InvestorProfileChrome>;
}
