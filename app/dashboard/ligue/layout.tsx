import { RoleGuard } from "@/modules/auth/guards";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="league">{children}</RoleGuard>;
}
