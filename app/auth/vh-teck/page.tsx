import { redirect } from "next/navigation";

import { PrivateAuthScreen } from "@/modules/auth/private-access/PrivateAuthScreen";
import { createPrivateAccessUseCase } from "@/modules/auth/private-access/private-access.factory";
import { sanitizePrivateDestination } from "@/modules/auth/private-access/policy";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SuperAdminAuthPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const destination = sanitizePrivateDestination("super_admin", first(params.next));
  const useCase = await createPrivateAccessUseCase();
  const { decision } = await useCase.current("super_admin");

  if (decision.authorized) {
    let mfaUnavailable = false;
    let currentLevel: "aal1" | "aal2" | null = null;
    let verifiedTotpFactorId: string | null = null;
    try {
      const mfa = await useCase.mfaState();
      currentLevel = mfa.currentLevel;
      verifiedTotpFactorId = mfa.verifiedTotpFactorId;
    } catch {
      mfaUnavailable = true;
    }

    if (mfaUnavailable) {
      return (
        <PrivateAuthScreen
          kind="super_admin"
          next={destination}
          hasSession
          initialMessage="Le service MFA Supabase n’est pas disponible. Vérifiez la configuration distante ou changez de compte."
        />
      );
    }

    if (currentLevel === "aal2") redirect(destination);
    const mfaRoute = verifiedTotpFactorId
      ? "/auth/vh-teck/mfa"
      : "/auth/vh-teck/mfa/enroll";
    redirect(`${mfaRoute}?next=${encodeURIComponent(destination)}`);
  }

  return (
    <PrivateAuthScreen
      kind="super_admin"
      next={destination}
      hasSession={decision.authenticated}
      initialMessage={decision.authenticated ? "Cette session ne permet pas d’ouvrir le Control Center." : null}
    />
  );
}
