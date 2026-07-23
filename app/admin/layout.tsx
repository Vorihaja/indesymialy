"use client";

import ErpAuthGuard from "../../components/auth/ErpAuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErpAuthGuard>
      <div className="min-h-screen bg-[#060a14]">{children}</div>
    </ErpAuthGuard>
  );
}