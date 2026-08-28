import type {
  ReactNode,
} from "react";

import "@/styles/account-erp.css";

import ErpAuthGuard from "@/components/auth/ErpAuthGuard";

import {
  AccountErpShell,
} from "@/modules/identity-core/components/AccountErpShell";


export default function Layout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <ErpAuthGuard>

      <AccountErpShell>
        {children}
      </AccountErpShell>

    </ErpAuthGuard>
  );
}