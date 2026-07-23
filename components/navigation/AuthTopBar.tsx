"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, User, PlusCircle, Clock } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ROLE_DASHBOARD_PATHS, getRoleDashboardPath } from "@/lib/role-routing";
import { useRoleRequest } from "@/providers/roles/RoleRequestContext";

interface AuthTopBarProps {
  isLightMode?: boolean;
}

interface RoleOption {
  slug: string;
  label: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  federation: "Fédération",
  ligue: "Ligue",
  club: "Club / Dojo",
  coach: "Coach",
  combattant: "Combattant",
  arbitre: "Arbitre / Juge",
  juge: "Arbitre / Juge",
  organisateur: "Organisateur",
  sponsor: "Sponsor",
  vendeur: "Vendeur",
  fan: "Fan",
};

export default function AuthTopBar({ isLightMode = false }: AuthTopBarProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<RoleOption[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { openModal, hasPendingRequest } = useRoleRequest();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        void fetchUserRoles(session.user.id, session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void fetchUserRoles(nextSession.user.id, nextSession.user.email);
      } else {
        setIsMenuOpen(false);
        setUserRoles([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string, email?: string) => {
    if (email === "jayaherve@proton.me") {
      setUserRoles([
        { slug: "super_admin", label: "Super Admin" },
        { slug: "fan", label: "Fan" },
      ]);
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("roles(slug, label)")
      .eq("user_id", userId);

    if (data && data.length > 0) {
      const rolesList: RoleOption[] = [];
      data.forEach((item: any) => {
        const r = Array.isArray(item.roles) ? item.roles[0] : item.roles;
        if (r?.slug) {
          rolesList.push({
            slug: r.slug,
            label: r.label || ROLE_LABELS[r.slug] || r.slug,
          });
        }
      });
      setUserRoles(rolesList.length ? rolesList : [{ slug: "fan", label: "Fan" }]);
    } else {
      setUserRoles([{ slug: "fan", label: "Fan" }]);
    }
  };

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  const handleGoToMySpace = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    if (user.email === "jayaherve@proton.me") {
      router.push("/admin");
      return;
    }

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("roles(slug)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    const role = userRole?.roles as { slug?: string } | { slug?: string }[] | null;
    router.push(getRoleDashboardPath(Array.isArray(role) ? role[0]?.slug : role?.slug));
  };

  const handleSelectRoleERP = (slug: string) => {
    setIsMenuOpen(false);
    const targetPath = ROLE_DASHBOARD_PATHS[slug] || "/dashboard";
    router.push(targetPath);
  };

  if (session) {
    const displayName = session.user?.email?.split("@")[0] || "Compte";

    return (
      <div ref={menuRef} className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          className={`flex items-center gap-1.5 rounded-none border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
            isLightMode
              ? "border-blue-600 bg-blue-600 text-white hover:border-blue-500 hover:bg-blue-500"
              : "border-blue-600/50 bg-blue-900/40 text-blue-100 hover:border-blue-500 hover:bg-blue-800/60"
          }`}
        >
          <User size={13} className="text-blue-300" />
          <span className="max-w-[110px] truncate">{displayName}</span>
          <ChevronDown size={14} className={`text-blue-300 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {isMenuOpen && (
          <div
            role="menu"
            className={`absolute right-0 top-full z-[200] mt-2 w-56 border p-1 shadow-2xl backdrop-blur-md ${
              isLightMode ? "border-slate-200 bg-white" : "border-neutral-800 bg-neutral-950/95"
            }`}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                void handleGoToMySpace();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                isLightMode ? "text-slate-700 hover:bg-blue-50 hover:text-blue-700" : "text-neutral-200 hover:bg-blue-500/15 hover:text-blue-300"
              }`}
            >
              <LayoutDashboard size={14} />
              Mon ESPACE
            </button>

            {/* BOUTON DE DEMANDE DE RÔLE OU STATUT AMBER DANS LE MENU DROPDOWN */}
            <div className="border-t border-neutral-800 my-1 pt-1">
              {hasPendingRequest ? (
                <div className="flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30">
                  <Clock size={13} className="animate-spin shrink-0" />
                  <span className="text-[10px]">En attente de validation</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    openModal();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500/15 transition-colors"
                >
                  <PlusCircle size={14} />
                  Demander un rôle
                </button>
              )}
            </div>

            {userRoles.length > 0 && (
              <div className="border-t border-neutral-800 my-1 pt-1">
                <div className="px-3 py-1 text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Basculer d'ERP</span>
                  <ChevronDown size={10} />
                </div>
                {userRoles.map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => handleSelectRoleERP(r.slug)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left font-mono text-xs transition-colors ${
                      isLightMode ? "text-slate-700 hover:bg-slate-100" : "text-zinc-300 hover:bg-neutral-900 hover:text-white"
                    }`}
                  >
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-neutral-800 pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                  isLightMode ? "text-red-600 hover:bg-red-50" : "text-red-400 hover:bg-red-500/10"
                }`}
              >
                <LogOut size={14} />
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href="/auth"
      className={`rounded-none border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
        isLightMode
          ? "border-red-600 bg-red-600 text-white hover:border-red-500 hover:bg-red-500"
          : "border-red-700 bg-red-700 text-white hover:border-red-600 hover:bg-red-600"
      }`}
    >
      Se connecter
    </Link>
  );
}
