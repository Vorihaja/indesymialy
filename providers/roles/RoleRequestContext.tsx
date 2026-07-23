"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { X, Check, Clock } from "lucide-react";
import { createClient } from "@/lib/client";

type Role = { id: string; label: string; slug: string };
type RoleRequest = { role_id: string; status: "pending" | "approved" | "rejected" };

interface RoleRequestContextType {
  openModal: () => void;
  hasPendingRequest: boolean;
  pendingRolesCount: number;
}

const RoleRequestContext = createContext<RoleRequestContextType>({
  openModal: () => undefined,
  hasPendingRequest: false,
  pendingRolesCount: 0,
});

export function useRoleRequest() {
  return useContext(RoleRequestContext);
}

export function RoleRequestProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const loadRolesAndRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: allRoles }, { data: userRoles }, { data: roleRequests, error }] = await Promise.all([
      supabase.from("roles").select("id, label, slug").order("label"),
      supabase.from("user_roles").select("role_id").eq("user_id", user.id),
      supabase.from("role_requests").select("role_id, status").eq("user_id", user.id),
    ]);

    if (error) {
      setMessage("La gestion des demandes doit être initialisée dans Supabase.");
      return;
    }

    const pending = (roleRequests ?? []).some((r) => r.status === "pending");
    setHasPendingRequest(pending);

    const unavailableRoleIds = new Set([
      ...(userRoles ?? []).map((item) => item.role_id),
      ...(roleRequests ?? [])
        .filter((item) => item.status === "pending")
        .map((item) => item.role_id),
    ]);

    setRoles((allRoles ?? []).filter((role) => !unavailableRoleIds.has(role.id)));
    setRequests(roleRequests ?? []);
  };

  useEffect(() => {
    void loadRolesAndRequests();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void loadRolesAndRequests();
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId]
    );
  };

  const submitRequests = async () => {
    if (!selectedRoleIds.length) {
      setMessage("Sélectionne au moins un rôle.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    const { error } = await supabase.rpc("submit_role_requests", { p_role_ids: selectedRoleIds });
    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSelectedRoleIds([]);
    setMessage("Demande envoyée à l’administration pour validation.");
    await loadRolesAndRequests();
    setTimeout(() => {
      setIsOpen(false);
      window.location.reload();
    }, 1200);
  };

  return (
    <RoleRequestContext.Provider
      value={{
        openModal: () => {
          setMessage("");
          setIsOpen(true);
          void loadRolesAndRequests();
        },
        hasPendingRequest,
        pendingRolesCount: requests.filter((r) => r.status === "pending").length,
      }}
    >
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg border border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-amber-400">
                  Formulaire de Demande de Rôles
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Sélectionnez un ou plusieurs rôles à demander à l'administration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid max-h-64 grid-cols-1 gap-2.5 overflow-y-auto sm:grid-cols-2 pr-1">
              {roles.map((role) => {
                const selected = selectedRoleIds.includes(role.id);
                return (
                  <label
                    key={role.id}
                    className={`flex cursor-pointer items-center justify-between border p-3 text-xs font-mono uppercase tracking-wide transition-all ${
                      selected
                        ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold"
                        : "border-neutral-800 text-zinc-300 hover:border-neutral-600 hover:bg-neutral-900"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRole(role.id)}
                        className="accent-amber-500"
                      />
                      {role.label}
                    </span>
                    {selected && <Check size={14} className="text-amber-400" />}
                  </label>
                );
              })}
              {!roles.length && !message && (
                <p className="col-span-full py-6 text-center text-xs font-mono text-zinc-500">
                  Aucun rôle supplémentaire disponible.
                </p>
              )}
            </div>

            {hasPendingRequest && (
              <div className="mt-4 border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-mono text-amber-400 flex items-center gap-2">
                <Clock size={14} className="animate-spin text-amber-400 shrink-0" />
                <span>Vous avez déjà une demande en attente de validation.</span>
              </div>
            )}

            {message && (
              <p
                className={`mt-4 text-xs font-mono ${
                  message.includes("envoyée") ? "text-emerald-400 font-bold" : "text-zinc-300"
                }`}
              >
                {message}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-neutral-800 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isLoading || !selectedRoleIds.length}
                onClick={submitRequests}
                className="bg-amber-500 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
              >
                {isLoading ? "Envoi…" : "Envoyer la demande"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleRequestContext.Provider>
  );
}
