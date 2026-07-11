"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRouterPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Récupérer le rôle (Ici via localStorage, à remplacer à terme par la session Supabase)
    const userRole = localStorage.getItem("indesy_user_role")?.toLowerCase();

    // 2. Redirection dynamique selon le rôle
    if (userRole === "combattant") {
      router.replace("/dashboard/combattant");
    } else if (userRole === "club") {
      router.replace("/dashboard/club");
    } else if (userRole === "admin") {
      router.replace("/dashboard/admin");
    } else {
      // Si aucun rôle ou rôle inconnu, retour à l'authentification
      router.replace("/auth");
    }
  }, [router]);

  // Petit loader discret pendant la redirection
  return (
    <div className="min-h-screen bg-black text-neutral-500 font-mono flex items-center justify-center text-xs uppercase tracking-widest">
      // Initialisation du cockpit en cours...
    </div>
  );
}