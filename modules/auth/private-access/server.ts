import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createPrivateAccessUseCase } from "./private-access.factory";
import {
  privateAuthRoute,
  sanitizePrivateDestination,
} from "./policy";
import type { PrivateAccessKind } from "./types";

function authDestination(kind: PrivateAccessKind, next: string, reason?: string): string {
  const params = new URLSearchParams({ next });
  if (reason) params.set("reason", reason);
  return `${privateAuthRoute(kind)}?${params.toString()}`;
}

export async function requestedPrivateDestination(kind: PrivateAccessKind): Promise<string> {
  const requestHeaders = await headers();
  return sanitizePrivateDestination(
    kind,
    requestHeaders.get("x-indesy-request-path"),
  );
}

export async function requirePrivateAccess(kind: PrivateAccessKind): Promise<void> {
  const destination = await requestedPrivateDestination(kind);
  const useCase = await createPrivateAccessUseCase();
  const { decision } = await useCase.current(kind);

  if (!decision.authenticated) {
    redirect(authDestination(kind, destination));
  }

  if (!decision.authorized) {
    await useCase.log("PRIVATE_ROUTE_ACCESS_DENIED", {
      kind,
      destination,
      source: "server_route_guard",
    });
    redirect(authDestination(kind, destination, "unauthorized"));
  }

  if (kind === "super_admin") {
    let mfaPath: string | null = null;
    try {
      const mfa = await useCase.mfaState();
      if (mfa.currentLevel !== "aal2") {
        mfaPath = mfa.verifiedTotpFactorId
          ? "/auth/vh-teck/mfa"
          : "/auth/vh-teck/mfa/enroll";
      }
    } catch {
      await useCase.log("SUPER_ADMIN_MFA_STATE_FAILED", {
        destination,
        source: "server_route_guard",
      });
      redirect(authDestination(kind, destination, "mfa_configuration"));
    }
    if (mfaPath) {
      redirect(`${mfaPath}?next=${encodeURIComponent(destination)}`);
    }
  }
}
