import type { ReactNode } from "react";

import { AdminShell } from "@/modules/admin";
import { requirePrivateAccess } from "@/modules/auth/private-access/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requirePrivateAccess("admin");
  return <AdminShell>{children}</AdminShell>;
}
