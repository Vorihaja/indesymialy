"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SessionUser = {
  id?: string;
  email?: string;
};

export default function TopbarNotifications() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (!error) {
        setUser(data.session?.user ?? null);
      }
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (!user) {
    return null;
  }

  return (
    <button
      type="button"
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 text-slate-200 transition hover:bg-slate-900 hover:text-white"
      aria-label="Notifications"
    >
      🔔
    </button>
  );
}
