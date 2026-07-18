"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ErpAuthGuardProps = {
  children: ReactNode;
};

export default function ErpAuthGuard({ children }: ErpAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Vérification de la session...");

  useEffect(() => {
    let isMounted = true;

    const verifySessionAndRole = async () => {
      // 1. Vérification de la session d'authentification globale
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (!isMounted) return;

      if (authError || !session) {
        router.replace("/auth");
        return;
      }

      try {
        if (isMounted) setLoadingMessage("Synchronisation de votre espace...");

        // 2. Récupération du rôle via la table de jointure profile_roles
        const { data: userRoleData, error: profileError } = await supabase
          .from("profile_roles")
          .select("roles(role_name)")
          .eq("profile_id", session.user.id)
          .single();

        if (!isMounted) return;

        const rolesData = userRoleData?.roles;
        const rawRole = (
          Array.isArray(rolesData)
            ? rolesData[0]?.role_name
            : (rolesData as any)?.role_name
        ) as string | undefined;

        if (profileError || !rawRole) {
          console.error("Guard Error: Rôle introuvable en base de données", profileError);
          router.replace("/auth");
          return;
        }

        // 3. Normalisation du rôle pour correspondre aux dossiers Next.js
        let mappedRoleFolder = rawRole.toLowerCase();
        if (mappedRoleFolder === "combattant") {
          mappedRoleFolder = "fighter";
        }

        // 4. Autorisation d'accès ou redirection
        if (pathname.startsWith(`/dashboard/${mappedRoleFolder}`)) {
          // L'utilisateur est sur son espace dédié : on autorise le rendu de la page
          setChecked(true);
        } else {
          // L'utilisateur tente d'aller ailleurs ou arrive de /dashboard : redirection forcée
          router.replace(`/dashboard/${mappedRoleFolder}`);
        }

      } catch {
        if (isMounted) router.replace("/auth");
      }
    };

    verifySessionAndRole();

    // Écouteur des changements d'état d'authentification
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (!session) {
        router.replace("/auth");
      } else if (event === "SIGNED_IN") {
        verifySessionAndRole();
      }
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [router, pathname]);

  // Écran de chargement personnalisé aux couleurs d'INDESY MIALY
  if (!checked) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center px-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 bg-amber-500 text-black font-black text-xs flex items-center justify-center rounded-sm animate-pulse">IM</div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">INDESY MIALY</span>
        </div>
        <p className="text-xs text-zinc-400 font-mono tracking-tight">{loadingMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}