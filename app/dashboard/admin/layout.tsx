import { requirePrivateAccess } from "@/modules/auth/private-access/server";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requirePrivateAccess("admin");
  return children;
}
