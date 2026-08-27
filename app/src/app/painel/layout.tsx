import { DashboardShell } from "@/components/dashboard-shell";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
