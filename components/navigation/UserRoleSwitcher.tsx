"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, ShieldCheck, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ROLE_DASHBOARD_PATHS } from "@/lib/role-routing";

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

interface UserRoleSwitcherProps {
  isLightMode?: boolean;
  onOpenRoleRequest?: () => void;
  className?: string;
}

export default function UserRoleSwitcher({ isLightMode = false, onOpenRoleRequest, className = "" }: UserRoleSwitcherProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [currentRoleSlug, setCurrentRoleSlug] = useState<string>("fan");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isSubscribed = true;

    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isSubscribed) {
        setUserEmail(user.email || "Utilisateur");
      }

      if (user.email === "jayaherve@proton.me") {
        if (isSubscribed) {
          setRoles([
            { slug: "super_admin", label: "Super Admin" },
            { slug: "fan", label: "Fan" }
          ]);
          if (pathname.startsWith("/admin")) {
            setCurrentRoleSlug("super_admin");
          }
        }
        return;
      }

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("roles(slug, label)")
        .eq("user_id", user.id);

      if (isSubscribed && userRoles) {
        const fetchedRoles: RoleOption[] = [];
        userRoles.forEach((item: any) => {
          const r = Array.isArray(item.roles) ? item.roles[0] : item.roles;
          if (r?.slug) {
            fetchedRoles.push({
              slug: r.slug,
              label: r.label || ROLE_LABELS[r.slug] || r.slug,
            });
          }
        });

        if (fetchedRoles.length === 0) {
          fetchedRoles.push({ slug: "fan", label: "Fan" });
        }

        setRoles(fetchedRoles);

        // Détection du rôle actif en fonction de l'URL
        const matched = fetchedRoles.find(r => {
          const path = ROLE_DASHBOARD_PATHS[r.slug];
          return path && pathname.startsWith(path);
        });
        if (matched) {
          setCurrentRoleSlug(matched.slug);
        } else {
          setCurrentRoleSlug(fetchedRoles[0].slug);
        }
      }
    }

    void loadUserData();

    return () => {
      isSubscribed = false;
    };
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectRole = (slug: string) => {
    setCurrentRoleSlug(slug);
    setIsOpen(false);
    const targetPath = ROLE_DASHBOARD_PATHS[slug] || "/dashboard";
    router.push(targetPath);
  };

  if (!userEmail) return null;

  const displayName = userEmail.split("@")[0];
  const activeLabel = ROLE_LABELS[currentRoleSlug] || currentRoleSlug;

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-none border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
          isLightMode
            ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
            : "border-blue-500/50 bg-blue-900/30 text-blue-200 hover:border-blue-500 hover:bg-blue-900/50 hover:text-white"
        }`}
        aria-expanded={isOpen}
      >
        <UserCheck className="h-3.5 w-3.5 text-blue-400" />
        <span className="max-w-[120px] truncate">{displayName}</span>
        <span className="text-[10px] text-blue-300/70">({activeLabel})</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-blue-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full z-[300] mt-1.5 w-56 border p-1 shadow-2xl backdrop-blur-md ${
            isLightMode ? "border-slate-200 bg-white" : "border-neutral-800 bg-neutral-950/95"
          }`}
        >
          <div className="px-3 py-2 border-b border-neutral-800 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            Changer de rôle (ERP)
          </div>
          <div className="py-1">
            {roles.map((r) => {
              const isSelected = r.slug === currentRoleSlug;
              return (
                <button
                  key={r.slug}
                  type="button"
                  onClick={() => handleSelectRole(r.slug)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left font-mono text-xs transition-colors ${
                    isSelected
                      ? "bg-blue-600/20 font-bold text-blue-400"
                      : isLightMode
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-zinc-300 hover:bg-neutral-900 hover:text-white"
                  }`}
                >
                  <span>{r.label}</span>
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                </button>
              );
            })}
          </div>

          {onOpenRoleRequest && (
            <div className="border-t border-neutral-800 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenRoleRequest();
                }}
                className="flex w-full items-center justify-center gap-1.5 bg-amber-500/10 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-400 transition-colors hover:bg-amber-500/20"
              >
                + Demander un rôle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
