import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUserProfessionalProfile } from "@/lib/data";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUserProfessionalProfile();
  return <DashboardShell hasProfile={Boolean(profile)}>{children}</DashboardShell>;
}
