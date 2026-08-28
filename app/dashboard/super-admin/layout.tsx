import { SystemRoleGuard } from "@/modules/auth/guards";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <SystemRoleGuard role='super_admin'>{children}</SystemRoleGuard>;
}
