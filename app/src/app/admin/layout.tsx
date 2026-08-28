import { AdminShell } from "@/components/admin-shell";
import { isCurrentUserSuperAdmin } from "@/lib/data";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isSuperAdmin = await isCurrentUserSuperAdmin();
  return <AdminShell isSuperAdmin={isSuperAdmin}>{children}</AdminShell>;
}
