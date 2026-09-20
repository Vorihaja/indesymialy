import { redirect } from "next/navigation";

import { PrivateAuthScreen } from "@/modules/auth/private-access/PrivateAuthScreen";
import { createPrivateAccessUseCase } from "@/modules/auth/private-access/private-access.factory";
import { sanitizePrivateDestination } from "@/modules/auth/private-access/policy";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAuthPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const destination = sanitizePrivateDestination("admin", first(params.next));
  const useCase = await createPrivateAccessUseCase();
  const { decision } = await useCase.current("admin");

  if (decision.authorized) redirect(destination);

  return (
    <PrivateAuthScreen
      kind="admin"
      next={destination}
      hasSession={decision.authenticated}
      initialMessage={decision.authenticated ? "Cette session ne permet pas d’ouvrir l’administration." : null}
    />
  );
}
