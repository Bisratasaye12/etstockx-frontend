import { AdminProfileChrome } from "@/features/profiles/components/admin-profile-chrome";

export default function AdminProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminProfileChrome>{children}</AdminProfileChrome>;
}
