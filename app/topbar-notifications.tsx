"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bell } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export default function TopbarNotifications() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Récupère la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Écoute les changements d'état (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 💡 L'icône n'apparaît QUE si la session existe
  if (!session) return null;

  return (
    <button className="relative p-2 text-slate-400 hover:text-amber-300 transition-colors">
      <Bell size={20} />
      {/* Ton badge de notification si présent */}
      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-orange-500" />
    </button>
  );
}