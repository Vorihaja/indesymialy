"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import ArbitreDashboardPage from "./components/ArbitreDashboard";
import ClubDashboardPage from "./components/ClubDashboard";
import CoachDashboardPage from "./components/CoachDashboard";
import CombattantDashboardPage from "./components/CombattantDashboard";
import FanDashboardPage from "./components/FanDashboard";
import JugeDashboardPage from "./components/JugeDashboard";
import OrganisateurDashboardPage from "./components/OrganisateurDashboard";
import SponsorDashboardPage from "./components/SponsorDashboard";
import VendeurDashboardPage from "./components/VendeurDashboard";

export default function DashboardIndex() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRole = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (error || !data?.session) {
        router.replace("/auth");
      } else {
        const metadata = data.session.user.user_metadata;
        const actualRole = (metadata?.role as string) || (metadata?.profile?.type as string) || null;
        if (!actualRole) {
          router.replace("/auth");
        } else {
          setRole(actualRole);
        }
      }
      setLoading(false);
    };

    fetchRole();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 text-sm">
        Chargement de l&apos;environnement...
      </div>
    );
  }

  switch (role) {
    case "arbitre":
      return <ArbitreDashboardPage />;
    case "club":
      return <ClubDashboardPage />;
    case "coach":
      return <CoachDashboardPage />;
    case "combattant":
      return <CombattantDashboardPage />;
    case "fan":
      return <FanDashboardPage />;
    case "juge":
      return <JugeDashboardPage />;
    case "organisateur":
      return <OrganisateurDashboardPage />;
    case "sponsor":
      return <SponsorDashboardPage />;
    case "vendeur":
      return <VendeurDashboardPage />;
    default:
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 text-sm">
          Rôle non reconnu.
        </div>
      );
  }
}
