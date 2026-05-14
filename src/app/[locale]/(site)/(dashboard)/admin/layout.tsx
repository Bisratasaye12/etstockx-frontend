import { AdminPanelShell } from "@/features/admin/components/admin-panel-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminPanelShell>{children}</AdminPanelShell>;
}
