"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  email?: string;
  user_metadata?: Record<string, unknown>;
};

function getUserName(user: UserProfile | null) {
  if (!user) return null;
  const metadata = user.user_metadata as { profile?: { fullName?: string }, fullName?: string } | undefined;
  if (metadata?.profile?.fullName) return metadata.profile.fullName;
  if (metadata?.fullName) return metadata.fullName;
  return user.email || null;
}

const ROLE_ERP_PATH: Record<string, string> = {
  combattant: "/dashboard",
  organisateur: "/dashboard",
  vendeur: "/dashboard",
  arbitre: "/dashboard",
  juge: "/dashboard",
  fan: "/dashboard",
  coach: "/dashboard",
  club: "/dashboard",
};

export default function AuthTopBar() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (error) {
        console.error("Supabase session check failed", error);
        setUser(null);
      } else {
        setUser(data.session?.user ?? null);
      }
      setIsLoading(false);
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const userName = getUserName(user);
  const initials = userName
    ? userName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
.map((part: string) => part?.[0]?.toUpperCase() ?? "")    : "IM";

  const role = (user?.user_metadata?.role as string) || "";
  const workspaceHref = ROLE_ERP_PATH[role] ?? "/dashboard/organisateur";

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erreur de déconnexion :", error);
      return;
    }
    setIsOpen(false);
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex h-11 min-w-[110px] items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 text-slate-400 text-sm">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
      >
        Se connecter
      </Link>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/80 px-3 py-2 transition hover:border-amber-300/50 hover:bg-white/10"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-black text-slate-950 shadow-md shadow-amber-500/20 transition-transform duration-200 group-hover:scale-105">
          {initials}
        </div>
        <div className="min-w-0 text-sm text-white text-left">
          <p className="truncate font-semibold">{userName ?? user.email}</p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Mon espace</span>
            <span className="text-[10px]">▾</span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[260px] rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="space-y-2">
            <Link
              href={workspaceHref}
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-amber-400/40 hover:bg-white/10"
            >
              Mon espace de travail
            </Link>
            <Link
              href="/marketplace"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-400/40 hover:bg-white/10"
            >
              Explorer la Marketplace
            </Link>
            <Link
              href="/combattants"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-400/40 hover:bg-white/10"
            >
              Voir les combattants
            </Link>
            <Link
              href="/dashboard/organisateur"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-400/40 hover:bg-white/10"
            >
              Calendrier des événements
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-2xl border border-white/10 bg-rose-500/10 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-rose-400/50 hover:bg-rose-500/15"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
