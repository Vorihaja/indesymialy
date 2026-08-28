"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type RoleRequestContextValue = {
  openModal: () => void;
  hasPendingRequest: boolean;
  pendingRolesCount: number;
};

const RoleRequestContext = createContext<RoleRequestContextValue>({
  openModal: () => undefined,
  hasPendingRequest: false,
  pendingRolesCount: 0,
});

export function useRoleRequest() {
  return useContext(RoleRequestContext);
}

/**
 * Adaptateur de navigation conservé pour les consommateurs historiques.
 * La persistance appartient exclusivement à identity-core.
 */
export function RoleRequestProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <RoleRequestContext.Provider
      value={{
        openModal: () => router.push("/role-requests/new"),
        hasPendingRequest: false,
        pendingRolesCount: 0,
      }}
    >
      {children}
    </RoleRequestContext.Provider>
  );
}
