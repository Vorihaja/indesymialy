"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, UserCheck } from "lucide-react";
import { useAuthContext } from "@/providers/auth/auth-context";
import { getWorkspaceDashboardPath, getWorkspaceLabel } from "@/modules/workspace-registry";

interface UserRoleSwitcherProps {
  isLightMode?: boolean;
  onOpenRoleRequest?: () => void;
  className?: string;
}

export default function UserRoleSwitcher({
  isLightMode = false,
  onOpenRoleRequest,
  className = "",
}: UserRoleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, roles } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(
    () => {
      const hasCanonicalOfficial = roles.some(
        (role) => role.slug === "official",
      );

      return roles
        .filter(
          (role) =>
            role.slug !== "referee" ||
            !hasCanonicalOfficial,
        )
        .map((role) => ({
          slug: role.slug,
          label: getWorkspaceLabel(role.slug) ?? role.label ?? role.slug,
        }));
    },
    [roles],
  );

  const currentRoleSlug = useMemo(() => {
    const matched = options.find((role) => {
      const path = getWorkspaceDashboardPath(role.slug);
      return path !== "/dashboard" && (pathname === path || pathname.startsWith(`${path}/`));
    });
    return matched?.slug ?? options[0]?.slug ?? "";
  }, [options, pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = (user.email ?? "Utilisateur").split("@")[0];
  const activeLabel = options.find((role) => role.slug === currentRoleSlug)?.label
    ?? getWorkspaceLabel(currentRoleSlug)
    ?? "Aucun rôle";

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex items-center gap-1.5 rounded-none border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
          isLightMode
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-blue-500/50 bg-blue-900/30 text-blue-200"
        }`}
      >
        <UserCheck className="h-3.5 w-3.5" />
        <span>{displayName}</span>
        <span>({activeLabel})</span>
        <ChevronDown className={`h-3.5 w-3.5 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full z-[300] mt-1.5 w-56 border p-1 shadow-xl ${
            isLightMode ? "bg-white" : "bg-neutral-950"
          }`}
        >
          <div className="border-b px-3 py-2 font-mono text-xs">Changer de rôle</div>
          {options.map((role) => (
            <button
              key={role.slug}
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push(getWorkspaceDashboardPath(role.slug));
              }}
              className="flex w-full justify-between px-3 py-2 text-left font-mono text-xs hover:bg-blue-900/30"
            >
              <span>{role.label}</span>
              {role.slug === currentRoleSlug && <span aria-label="Rôle actif">●</span>}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (onOpenRoleRequest) onOpenRoleRequest();
              else router.push("/role-requests/new");
            }}
            className="mt-2 w-full border-t px-3 py-2 text-xs text-amber-400"
          >
            + Ajouter ou demander un rôle
          </button>
        </div>
      )}
    </div>
  );
}
