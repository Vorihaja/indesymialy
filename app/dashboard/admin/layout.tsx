import { AdminGuard } from "@/modules/auth/guards";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
