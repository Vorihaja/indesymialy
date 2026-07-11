"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AdminWorkspace() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("utilisateurs")

  useEffect(() => {
    async function checkAdminPayload() {
      // 1. Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace("/auth")
        return
      }

      // 2. Vérifier s'il a le rôle Admin dans la base de données
      const { data, error } = await supabase
        .from("profile_roles")
        .select("roles(role_name)")
        .eq("profile_id", user.id)
        .single()

      // @ts-ignore
      if (data?.roles?.role_name === "Admin") {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
        router.replace("/dashboard") // Redirection si simple utilisateur
      }
      setLoading(false)
    }

    checkAdminPayload()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center text-sm">
        Chargement de la console suprême...
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* BARRE LATÉRALE DE COMMANDE */}
      <div className="w-full md:w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col shrink-0">
        <h1 className="text-xl font-black tracking-wider text-white">INDESY MIALY</h1>
        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-6">Console Super Admin</p>
        
        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab("utilisateurs")}
            className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              activeTab === "utilisateurs" 
                ? "bg-amber-500 text-slate-950" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Structure & Profils
          </button>
          <button 
            onClick={() => setActiveTab("dashboards")}
            className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              activeTab === "dashboards" 
                ? "bg-amber-500 text-slate-950" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Gestion Dashboards
          </button>
          <button 
            onClick={() => setActiveTab("disciplines")}
            className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              activeTab === "disciplines" 
                ? "bg-amber-500 text-slate-950" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Sports & Disciplines
          </button>
        </nav>
      </div>

      {/* ZONE DE TRAVAIL PRINCIPALE */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        
        {activeTab === "utilisateurs" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Contrôle des Utilisateurs</h2>
            <p className="text-sm text-slate-400 mb-6">Vue globale sur tous les comptes inscrits (Combattants, Coachs, Arbitres, Fédérations).</p>
            
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
              <p className="text-xs text-slate-500">Zone d'édition des privilèges et activation des comptes en attente.</p>
            </div>
          </div>
        )}

        {activeTab === "dashboards" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Configuration des Dashboards</h2>
            <p className="text-sm text-slate-400 mb-6">Ajuste les permissions, les widgets et les accès aux différents panneaux de la plateforme.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
                <h3 className="text-sm font-bold text-amber-500 uppercase mb-3">Dashboard Combattant</h3>
                <button className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded border border-slate-700 transition-colors">
                  Configurer
                </button>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
                <h3 className="text-sm font-bold text-amber-500 uppercase mb-3">Dashboard Fédération</h3>
                <button className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded border border-slate-700 transition-colors">
                  Configurer
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "disciplines" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Paramétrage des Combats</h2>
            <p className="text-sm text-slate-400 mb-6">Mets à jour ou supprime les arts martiaux et sports de combat officiels gérés par Indesy Mialy (Judo, MMA, etc.).</p>
            
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Ajouter une discipline officielle</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="EX: JUDO, MMA, KICK-BOXING..." 
                  className="px-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-amber-500 flex-1" 
                />
                <button className="px-5 py-2 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold uppercase tracking-wider rounded transition-colors">
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}