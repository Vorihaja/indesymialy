"use client";

import { useAuth } from "@/modules/auth/hooks";

export function AuthenticatedCommunicationGuard({
  children,
  embedded = false,
}: {
  children: React.ReactNode;
  embedded?: boolean;
}) {
  const { authenticated, loading } = useAuth();
  const frameClassName = embedded ? "" : "mx-auto mt-8 max-w-[1500px]";

  if (loading) {
    return (
      <p className={frameClassName + " border border-[#303238] bg-[#151619] p-6 text-sm text-[#8b8f98]"}>
        Vérification de la session…
      </p>
    );
  }

  if (!authenticated) {
    return (
      <section className={frameClassName + " border border-red-500/30 bg-red-500/5 p-6"}>
        <h1 className="font-black text-red-400">Connexion requise</h1>
        <p className="mt-2 text-sm text-[#8b8f98]">Les conversations et notifications sont privées.</p>
      </section>
    );
  }

  return <>{children}</>;
}
