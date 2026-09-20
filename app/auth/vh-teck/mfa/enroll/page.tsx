import { redirect } from "next/navigation";

import { PrivateMfaScreen } from "@/modules/auth/private-access/PrivateMfaScreen";
import { createPrivateAccessUseCase } from "@/modules/auth/private-access/private-access.factory";
import { sanitizePrivateDestination } from "@/modules/auth/private-access/policy";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SuperAdminMfaEnrollPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const destination = sanitizePrivateDestination("super_admin", rawNext);
  const useCase = await createPrivateAccessUseCase();
  const { decision } = await useCase.current("super_admin");

  if (!decision.authorized) {
    redirect(`/auth/vh-teck?next=${encodeURIComponent(destination)}`);
  }

  let mfa;
  try {
    mfa = await useCase.mfaState();
  } catch {
    redirect(`/auth/vh-teck?next=${encodeURIComponent(destination)}&reason=mfa_configuration`);
  }

  if (mfa.currentLevel === "aal2") redirect(destination);
  if (mfa.verifiedTotpFactorId) {
    redirect(`/auth/vh-teck/mfa?next=${encodeURIComponent(destination)}`);
  }

  return <PrivateMfaScreen mode="enroll" next={destination} />;
}
