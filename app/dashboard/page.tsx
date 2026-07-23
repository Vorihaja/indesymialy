"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import { useRoleRequest } from "./layout";
import UserRoleSwitcher from "../../components/navigation/UserRoleSwitcher";
import { Clock, CheckCircle2, XCircle, ChevronDown } from "lucide-react";

const ROLE_CONFIG: any = {
  super_admin: { label: "SUPER ADMIN", color: "#1230ff", modules: ["Tous les modules"] },
  federation: { label: "FÉDÉRATION", color: "#1230ff", modules: ["Ligues", "Clubs", "Licences", "Compétitions", "Finances"] },
  ligue: { label: "LIGUE", color: "#1230ff", modules: ["Clubs", "Compétitions", "Arbitres", "Finances"] },
  club: { label: "CLUB / DOJO", color: "#00e676", modules: ["Membres", "Combattants", "Coachs", "Finances", "Boutique"] },
  coach: { label: "COACH", color: "#00e676", modules: ["Mes Combattants", "Planning", "Résultats"] },
  combattant: { label: "COMBATTANT", color: "#ff3b30", modules: ["Ma Licence", "Mes Combats", "Palmarès", "Poids"] },
  arbitre: { label: "ARBITRE / JUGE", color: "#ffcc00", modules: ["Désignations", "Events à juger", "Historique"] },
  organisateur: { label: "ORGANISATEUR", color: "#1230ff", modules: ["Créer Event", "Inscriptions", "Scan QR", "Billetterie"] },
  vendeur: { label: "VENDEUR", color: "#00e676", modules: ["Produits", "Stock", "Commandes", "CA"] },
  fan: { label: "FAN", color: "#5b7cff", modules: ["Favoris", "Billets", "Combattants suivis"] },
};

interface ReviewedNotification {
  type: "success" | "error";
  message: string;
  roleName: string;
}

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [activeRole, setActiveRole] = useState<string>("");
  const [org, setOrg] = useState<any>(null);
  const [userEmail, setUserEmail] = useState("");
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [notification, setNotification] = useState<ReviewedNotification | null>(null);
  const { openModal } = useRoleRequest();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserEmail(user.email || "");

      if (user.email === "jayaherve@proton.me") {
        setRoles(["super_admin"]);
        setActiveRole("super_admin");
        setLoading(false);
        return;
      }

      // Récupère les rôles attribués
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("roles(slug)")
        .eq("user_id", user.id);
      const slugs = userRoles?.map((ur: any) => ur.roles.slug) || [];

      if (slugs.length === 0) {
        const { data: fanRole } = await supabase
          .from("roles")
          .select("id")
          .eq("slug", "fan")
          .single();
        if (fanRole) {
          await supabase.from("user_roles").insert({ user_id: user.id, role_id: fanRole.id });
          setRoles(["fan"]);
          setActiveRole("fan");
        }
      } else {
        setRoles(slugs);
        setActiveRole(slugs[0]);
      }

      // Récupère les demandes de rôles pour vérifier l'état 'pending'
      const { data: pendingRequests } = await supabase
        .from("role_requests")
        .select("id, status, reviewed_at, roles(label, slug)")
        .eq("user_id", user.id);

      if (pendingRequests && pendingRequests.some((r) => r.status === "pending")) {
        setHasPendingRequest(true);
      } else {
        setHasPendingRequest(false);
      }

      // Vérifier si une demande a été récemment validée ou rejetée
      const recentlyReviewed = pendingRequests?.find(
        (r) => r.status === "approved" || r.status === "rejected"
      );

      if (recentlyReviewed) {
        const role = Array.isArray(recentlyReviewed.roles)
          ? recentlyReviewed.roles[0]
          : recentlyReviewed.roles;
        const roleLabel = role?.label || role?.slug || "rôle";

        if (recentlyReviewed.status === "approved") {
          setNotification({
            type: "success",
            message: "Votre demande a été validée",
            roleName: roleLabel,
          });
        } else if (recentlyReviewed.status === "rejected") {
          setNotification({
            type: "error",
            message: "Votre demande a été rejetée",
            roleName: roleLabel,
          });
        }
      }

      // Cherche son orga si rôle orga
      const orgRoles = ["federation", "ligue", "club", "organisateur", "vendeur"];
      if (slugs.some((s: string) => orgRoles.includes(s))) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("owner_id", user.id)
          .limit(1)
          .single();
        if (orgData) setOrg(orgData);
      }

      setLoading(false);
    })();
  }, []);

  if (loading)
    return (
      <div className="fixed inset-x-0 bottom-0 top-[var(--platform-header-height)] z-[9999] bg-[#060a14] grid place-items-center text-white text-xs font-mono tracking-widest">
        DASHBOARD • CHARGEMENT...
      </div>
    );

  const config = ROLE_CONFIG[activeRole] || ROLE_CONFIG.fan;
  const displayName = userEmail.split("@")[0];

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--platform-header-height)] z-[9998] bg-[#060a14] text-white flex overflow-hidden antialiased">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap'); *{font-family:Inter,sans-serif}.mono{font-family:JetBrains Mono,monospace}`}</style>

      <aside style={{ width: "260px" }} className="shrink-0 overflow-hidden bg-[#080d1c] border-r border-[rgba(26,42,90,0.4)] flex flex-col font-sans">
        <div className="shrink-0 px-4 py-4 border-b border-[rgba(26,42,90,0.25)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#1230ff] grid place-items-center text-xs font-black shrink-0">IM</div>
              <div className="flex min-w-0 flex-col leading-none gap-1">
                <span className="text-xs font-bold tracking-wide truncate">{config.label}</span>
                <span className="text-xs text-zinc-400 truncate">{displayName}</span>
              </div>
            </div>
          </div>

          {/* Remplacement du bouton par le statut Amber si en attente */}
          {hasPendingRequest ? (
            <div className="w-full border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-center text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-2">
              <Clock size={14} className="animate-spin text-amber-400" />
              <span>En attente de validation</span>
            </div>
          ) : (
            <button
              onClick={openModal}
              className="w-full border border-amber-500/50 bg-amber-600/15 px-3 py-2 text-xs font-mono font-bold tracking-wide text-amber-200 transition hover:bg-amber-600 hover:text-black"
            >
              + DEMANDER UN RÔLE
            </button>
          )}

          {/* Composant de sélection d'ERP avec flèche à côté du nom */}
          <div className="pt-1">
            <UserRoleSwitcher onOpenRoleRequest={openModal} className="w-full" />
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-4 flex flex-col gap-1">
          {config.modules.map((m: string) => (
            <button key={m} className="h-9 w-full shrink-0 whitespace-nowrap rounded-lg text-xs font-semibold tracking-wide text-left px-3 bg-[#0b1226] border border-[rgba(26,42,90,0.3)] text-zinc-300 hover:text-white">
              {m}
            </button>
          ))}
        </nav>

        <div className="p-2.5 border-t border-[rgba(26,42,90,0.25)] space-y-2">
          {roles.length > 1 && (
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                <ChevronDown size={10} />
                CHOISIR UN RÔLE / ERP
              </p>
              <div className="flex flex-wrap gap-1">
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveRole(r)}
                    className={`text-[11px] font-mono px-2 py-1 border transition-all ${
                      activeRole === r
                        ? "bg-[#1230ff] text-white border-[#1230ff] font-bold"
                        : "bg-[#0b1226] text-zinc-400 border-[rgba(26,42,90,0.4)] hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => router.push("/")} className="h-9 w-full rounded-none bg-[#0b1226] border border-[rgba(26,42,90,0.6)] text-xs font-mono text-zinc-400 hover:text-white">
            ← SITE PUBLIC
          </button>
          {activeRole === "super_admin" && (
            <button onClick={() => router.push("/admin")} className="h-9 w-full rounded-none bg-[#1230ff] text-xs font-mono font-bold text-white hover:bg-blue-600">
              SUPER ADMIN
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto bg-[#060a14]">
        <div className="w-full max-w-7xl p-5 lg:p-8 space-y-6">
          {/* Bannière de notification Récente (Verte si validée / Rouge si rejetée) */}
          {notification && (
            <div
              className={`p-4 border font-mono text-xs flex items-center justify-between shadow-lg ${
                notification.type === "success"
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                  : "border-red-500/40 bg-red-950/30 text-red-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {notification.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold uppercase block tracking-wider">
                    {notification.message}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {notification.type === "success"
                      ? `Votre demande de rôle (${notification.roleName}) a été approuvée par l'administration.`
                      : `Votre demande de rôle (${notification.roleName}) a été refusée.`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                Fermer
              </button>
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl lg:text-2xl font-black leading-none">{config.label} • ERP DASHBOARD</h1>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-xs font-bold tracking-[0.2em] text-[#5b7cff] font-mono uppercase">
                  IDENTIFIANT: {userEmail}
                </p>
                <span className="text-zinc-600 font-mono">•</span>
                <p className="text-xs font-mono text-amber-400 uppercase">
                  RÔLE ACTIF: {activeRole}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
              <span className="text-xs font-mono text-zinc-500">EN LIGNE</span>
            </div>
          </div>

          {!org && ["federation", "ligue", "club", "organisateur", "vendeur"].includes(activeRole) ? (
            <div className="bg-[#0b1226] border border-[rgba(26,42,90,0.6)] p-10 text-center">
              <h2 className="text-lg font-black">Aucune organisation trouvée</h2>
              <p className="text-xs text-zinc-400 mt-2">
                Tu es {activeRole} mais tu n'as pas encore créé ton organisation. Crée-la pour apparaître dans l'annuaire.
              </p>
              <button
                onClick={async () => {
                  const name = prompt(`Nom de ton ${activeRole}?`);
                  if (!name) return;
                  const { data: { user } } = await supabase.auth.getUser();
                  const { data, error } = await supabase
                    .from("organizations")
                    .insert({ name, type: activeRole, owner_id: user?.id })
                    .select()
                    .single();
                  if (error) alert(error.message);
                  else {
                    setOrg(data);
                    location.reload();
                  }
                }}
                className="mt-6 h-10 px-6 bg-[#1230ff] text-xs font-bold font-mono uppercase hover:bg-blue-600 transition-colors"
              >
                + CRÉER MON {activeRole.toUpperCase()}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#0b1226] border border-[rgba(26,42,90,0.6)] p-5 flex flex-col justify-between">
                  <div className="text-xs font-mono text-zinc-500">ORGANISATION</div>
                  <div className="mt-2">
                    <div className="text-base font-black leading-tight truncate">{org?.name || "Espace Personnel"}</div>
                    <div className="text-xs font-mono text-zinc-400 mt-1">{activeRole}</div>
                  </div>
                </div>
                <div className="bg-[#0b1226] border border-[rgba(26,42,90,0.6)] p-5 flex flex-col justify-between">
                  <div className="text-xs font-mono text-zinc-500">UTILISATEUR</div>
                  <div className="text-sm font-black truncate mt-2">{displayName}</div>
                </div>
                <div className="bg-[#0b1226] border border-[rgba(26,42,90,0.6)] p-5 flex flex-col justify-between">
                  <div className="text-xs font-mono text-zinc-500">DEMANDE RÔLE</div>
                  <div className="text-xs font-mono font-bold mt-2 text-amber-400">
                    {hasPendingRequest ? "EN ATTENTE (AMBER)" : "DISPONIBLE"}
                  </div>
                </div>
                <div className="bg-[#1230ff] p-5 flex flex-col justify-between">
                  <div className="text-xs font-mono text-white/70">STATUT ERP</div>
                  <div className="text-xs font-bold font-mono">ACTIF</div>
                </div>
              </div>

              <div className="bg-[#0b1226] border border-[rgba(26,42,90,0.6)] p-5">
                <h2 className="text-xs font-bold font-mono tracking-[0.16em]">MODULES DE L'ERP • {activeRole.toUpperCase()}</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {config.modules.map((m: string) => (
                    <div key={m} className="h-20 bg-[#080e20] border border-[rgba(26,42,90,0.25)] p-4 flex flex-col justify-between">
                      <span className="text-xs font-medium text-zinc-200">{m}</span>
                      <span className="text-[10px] font-mono text-zinc-500">Module prêt</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
