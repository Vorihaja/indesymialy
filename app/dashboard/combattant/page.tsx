"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, User, Shield, Dumbbell, HeartPulse, Apple, Scale, 
  Coins, Briefcase, Calendar, Target, Package, Film, 
  Network, Trophy, BarChart3, ShoppingBag, Share2, FileText, 
  Settings, LogOut, PlusCircle, FolderPlus, Activity, AlertTriangle, 
  TrendingUp, Award, Clock, Heart, CheckCircle2, ChevronRight
} from "lucide-react";

// Types des modules principaux demandés
type CombattantModule = 
  | "overview" | "profile" | "career" | "training" | "health" 
  | "nutrition" | "weight" | "finances" | "sponsors" | "agenda" 
  | "objectives" | "gear" | "media" | "network" | "rankings" 
  | "analyses" | "marketplace" | "socials" | "admin" | "settings" | string;

export default function CombattantDashboard() {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<CombattantModule>("overview");
  
  // États de sous-navigation pour chaque module (Top Bar interne)
  const [subOverview, setSubOverview] = useState<"general" | "stats" | "alerts" | "activities">("general");
  const [subProfile, setSubProfile] = useState<"infos" | "mensurations" | "disciplines" | "club" | "coach" | "licences">("infos");
  const [subCareer, setSubCareer] = useState<"combats" | "history" | "rewards" | "timeline" | "stats">("combats");
  const [subTraining, setSubTraining] = useState<"planning" | "sessions" | "physique" | "analysis">("planning");
  const [subHealth, setSubHealth] = useState<"examens" | "blessures" | "visites" | "vaccins" | "allergies" | "medicaments">("examens");
  const [subNutrition, setSubNutrition] = useState<"programme" | "repas" | "hydratation" | "complements">("programme");
  const [subWeight, setSubWeight] = useState<"history" | "objectives" | "curves">("history");
  const [subFinances, setSubFinances] = useState<"revenus" | "depenses" | "bilan" | "paiements">("revenus");
  const [subSponsors, setSubSponsors] = useState<"sponsors" | "contrats" | "documents" | "signature">("sponsors");
  const [subAgenda, setSubAgenda] = useState<"calendrier" | "combats" | "entraînements" | "pesées" | "examens" | "évènements">("calendrier");
  const [subObjectives, setSubObjectives] = useState<"objectifs" | "progression" | "historique">("objectifs");
  const [subGear, setSubGear] = useState<"inventaire" | "maintenance" | "remplacement">("inventaire");
  const [subMedia, setSubMedia] = useState<"photos" | "videos" | "combats" | "documents" | "interviews">("photos");
  const [subNetwork, setSubNetwork] = useState<"contacts" | "communication" | "messages" | "notifications">("contacts");
  const [subRankings, setSubRankings] = useState<"national" | "regional" | "mondial" | "historique">("national");
  const [subAnalyses, setSubAnalyses] = useState<"stats" | "video" | "ia" | "ipi">("stats");
  const [subMarket, setSubMarket] = useState<"annonces" | "ventes" | "services" | "stats">("annonces");
  const [subSocials, setSubSocials] = useState<"comptes" | "publications" | "programmation" | "stats">("comptes");
  const [subAdmin, setSubAdmin] = useState<"documents" | "licences" | "assurances" | "identite">("documents");
  const [subSettings, setSubSettings] = useState<"compte" | "securite" | "notifications" | "confidentialite" | "preferences">("compte");


  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-mono flex selection:bg-red-600 selection:text-white">
      
      {/* SIDEBAR — GRANDS MODULES UNIQUEMENT */}
      <aside className="w-64 border-r border-neutral-900 bg-neutral-950 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] pr-1 [scrollbar-width:none]">
          <div>
            <h1 className="text-md font-black tracking-tight text-neutral-100 uppercase">INDESY MIALY</h1>
            <span className="text-[10px] text-red-500">// ESPACE COMBATTANT</span>
          </div>

          <nav className="space-y-0.5">
            <span className="text-[9px] text-neutral-600 uppercase font-bold tracking-widest block px-3 pb-1">// Menu Principal</span>
            
            <button onClick={() => setActiveModule("overview")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "overview" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Home size={14} /> Tableau de bord</button>
            <button onClick={() => setActiveModule("profile")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "profile" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><User size={14} /> Profil</button>
            <button onClick={() => setActiveModule("career")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "career" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Shield size={14} /> Carrière sportive</button>
            <button onClick={() => setActiveModule("training")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "training" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Dumbbell size={14} /> Entraînements</button>
            <button onClick={() => setActiveModule("health")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "health" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><HeartPulse size={14} /> Santé</button>
            <button onClick={() => setActiveModule("nutrition")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "nutrition" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Apple size={14} /> Nutrition</button>
            <button onClick={() => setActiveModule("weight")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "weight" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Scale size={14} /> Gestion du poids</button>
            <button onClick={() => setActiveModule("finances")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "finances" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Coins size={14} /> Finances</button>
            <button onClick={() => setActiveModule("sponsors")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "sponsors" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Briefcase size={14} /> Sponsors & Contrats</button>
            <button onClick={() => setActiveModule("agenda")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "agenda" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Calendar size={14} /> Agenda</button>
            <button onClick={() => setActiveModule("objectives")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "objectives" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Target size={14} /> Objectifs</button>
            <button onClick={() => setActiveModule("gear")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "gear" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Package size={14} /> Matériel</button>
            <button onClick={() => setActiveModule("media")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "media" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Film size={14} /> Médiathèque</button>
            <button onClick={() => setActiveModule("network")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "network" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Network size={14} /> Réseau</button>
            <button onClick={() => setActiveModule("rankings")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "rankings" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Trophy size={14} /> Classements</button>
            <button onClick={() => setActiveModule("analyses")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "analyses" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><BarChart3 size={14} /> Analyses</button>
            <button onClick={() => setActiveModule("marketplace")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "marketplace" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><ShoppingBag size={14} /> Marketplace</button>
            <button onClick={() => setActiveModule("socials")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "socials" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Share2 size={14} /> Réseaux sociaux</button>
            <button onClick={() => setActiveModule("admin")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "admin" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><FileText size={14} /> Administration</button>
            <button onClick={() => setActiveModule("settings")} className={`w-full h-8 px-3 text-xs uppercase tracking-wider font-bold flex items-center gap-2.5 transition-all ${activeModule === "settings" ? "bg-neutral-900 text-neutral-100 border-l-2 border-yellow-500" : "text-neutral-500 hover:text-neutral-300"}`}><Settings size={14} /> Paramètres</button>
        </nav>
        </div>
            

        <button onClick={handleLogout} className="h-8 w-full border border-neutral-900 bg-black hover:bg-red-950/20 hover:border-red-900 text-xs uppercase tracking-wider text-neutral-500 hover:text-red-400 transition-all flex items-center justify-center gap-2 mt-2 shrink-0"><LogOut size={13} /> Déconnexion</button>
      </aside>

      {/* ZONE DE CONTENU CENTRAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BARRE DU COMPOSANT CENTRAL */}
        <header className="h-16 border-b border-neutral-900 bg-neutral-950 px-6 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400">Athlète : <span className="text-yellow-500 font-bold uppercase">PRO_MODE</span> — Ville : <span className="text-neutral-200 font-bold uppercase"></span></div>
          <div className="text-[11px] text-neutral-600 font-mono">// SECURE_NODE_OK</div>
        </header>

        {/* MAIN COCKPIT */}
        <main className="flex-1 p-6 overflow-y-auto bg-black relative">

          {/* ========================================================= */}
          {/* M1 — TABLEAU DE BORD */}
          {activeModule === "overview" && (
            <div className="space-y-6">
              {/* Top bar interne */}
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                <button onClick={() => setSubOverview("general")} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subOverview === "general" ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>Vue générale</button>
                <button onClick={() => setSubOverview("stats")} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subOverview === "stats" ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>Statistiques</button>
                <button onClick={() => setSubOverview("alerts")} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subOverview === "alerts" ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>Alertes</button>
                <button onClick={() => setSubOverview("activities")} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subOverview === "activities" ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>Activités récentes</button>
              </div>

              {subOverview === "general" && (
                <div className="space-y-6">
                  {/* Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 uppercase block">Prochain combat</span><p className="text-sm font-bold text-neutral-200 mt-1">15 Aoû 2026</p></div>
                    <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 uppercase block">Entraînement du jour</span><p className="text-sm font-bold text-neutral-200 mt-1">Sparring - 18:00</p></div>
                    <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 uppercase block">Poids actuel</span><p className="text-sm font-bold text-neutral-200 mt-1">71.5 kg</p></div>
                    <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 uppercase block">Classement</span><p className="text-sm font-bold text-yellow-500 mt-1">#1 National</p></div>
                    <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 uppercase block">Revenus (Mois)</span><p className="text-sm font-bold text-neutral-200 mt-1">1 200 000 MGA</p></div>
                    <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 uppercase block">Sponsor actif</span><p className="text-sm font-bold text-neutral-200 mt-1">Telma Mada</p></div>
                    <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 uppercase block">Documents expirant bientôt</span><p className="text-sm font-bold text-red-500 mt-1">Licence JFM</p></div>
                    <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 uppercase block">Indice IPI</span><p className="text-sm font-bold text-emerald-500 mt-1">89.2 / 100</p></div>
                  </div>
                  {/* Graphiques placeholders */}
                  <div className="border border-neutral-900 bg-neutral-950 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-neutral-400">// Visualisation des données analytiques</h3>
                    <div className="grid grid-cols-5 gap-2 pt-4 h-24 items-end max-w-xs text-center text-[9px] text-neutral-500">
                      <div><div className="bg-blue-600 h-16 w-full"></div>Progression</div>
                      <div><div className="bg-emerald-600 h-20 w-full"></div>Victoires</div>
                      <div><div className="bg-red-600 h-12 w-full"></div>Poids</div>
                      <div><div className="bg-yellow-600 h-14 w-full"></div>Revenus</div>
                      <div><div className="bg-neutral-700 h-18 w-full"></div>Entraînements</div>
                    </div>
                  </div>
                </div>
              )}
              {subOverview !== "general" && <div className="text-xs text-neutral-500">// Données en cours de synchronisation...</div>}
            </div>
          )}

          {/* ========================================================= */}
          {/* M2 — PROFIL */}
          {activeModule === "profile" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["infos", "mensurations", "disciplines", "club", "coach", "licences"].map((tab) => (
                  <button key={tab} onClick={() => setSubProfile(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subProfile === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="border border-neutral-900 bg-neutral-950 p-6 space-y-4">
                <span className="text-[10px] text-neutral-500 font-mono">// CRUD ENGINE : INFORMATIONS GENERALES</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-2">
                    <p><span className="font-mono text-neutral-500 text-[11px] block">NOM COMPLET :</span> <input type="text" defaultValue="Ranaivo Martial" className="bg-black border border-neutral-800 p-1 w-full text-neutral-200 focus:outline-none" /></p>
                    <p><span className="font-mono text-neutral-500 text-[11px] block">SURNOM :</span> <input type="text" defaultValue="The Boeny Tiger" className="bg-black border border-neutral-800 p-1 w-full text-neutral-200 focus:outline-none" /></p>
                    <p><span className="font-mono text-neutral-500 text-[11px] block">DATE DE NAISSANCE :</span> <input type="text" defaultValue="14/05/2001" className="bg-black border border-neutral-800 p-1 w-full text-neutral-200 focus:outline-none" /></p>
                    <p><span className="font-mono text-neutral-500 text-[11px] block">SEXE / NATIONALITÉ :</span> M / Malagasy</p>
                    <p><span className="font-mono text-neutral-500 text-[11px] block">RÉGION D'ANCRAGE :</span> Boeny (Mahajanga)</p>
                  </div>
                  <div className="space-y-2">
                    <p><span className="font-mono text-neutral-500 text-[11px] block">STYLE DOMINANT / GARDE :</span> Striker / Orthodoxe</p>
                    <p><span className="font-mono text-neutral-500 text-[11px] block">CATÉGORIE DE POIDS :</span> Lightweight (70.3 kg)</p>
                    <p><span className="font-mono text-neutral-500 text-[11px] block">ALLONGE :</span> 182 cm</p>
                    <p><span className="font-mono text-neutral-500 text-[11px] block">DISCIPLINES PRATIQUÉES :</span> MMA, Kickboxing, Judo</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M3 — CARRIÈRE SPORTIVE */}
          {activeModule === "career" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["combats", "history", "rewards", "timeline", "stats"].map((tab) => (
                  <button key={tab} onClick={() => setSubCareer(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subCareer === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              
              {subCareer === "combats" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-[10px] text-neutral-500 font-mono">// ENGINE_CRUD: REGISTRE DES CONFRONTATIONS</span><button className="h-7 px-3 bg-red-950 text-red-400 border border-red-900 text-[10px] uppercase font-bold hover:bg-red-900 hover:text-white transition-all">Ajouter combat</button></div>
                  <table className="w-full text-[11px] border border-neutral-900 text-left">
                    <thead><tr className="bg-neutral-950 text-neutral-400 uppercase font-bold border-b border-neutral-900"><th className="p-2">Date</th><th className="p-2">Adversaire</th><th className="p-2">Évènement</th><th className="p-2">Ville</th><th className="p-2">Discipline</th><th className="p-2">Résultat</th><th className="p-2">Méthode</th><th className="p-2">Actions</th></tr></thead>
                    <tbody><tr className="border-b border-neutral-900 font-sans">
                      <td className="p-2 font-mono text-[10px]">12/04/2026</td><td className="p-2 font-bold">Andry "The Flash"</td><td className="p-2">Mada FC 4</td><td className="p-2">Mahajanga</td><td className="p-2 font-mono text-[10px]">MMA</td><td className="p-2 text-emerald-500 font-bold">VICTOIRE</td><td className="p-2">KO (Round 2, 2:14)</td>
                      <td className="p-2 font-mono text-[10px] space-x-2"><button className="text-neutral-400 hover:text-white">Modifier</button><button className="text-red-500">Supprimer</button></td>
                    </tr></tbody>
                  </table>
                </div>
              )}

              {subCareer === "stats" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border border-neutral-900 bg-neutral-950 p-4 text-center"><span className="text-[10px] text-neutral-500 block uppercase">Total combats</span><span className="text-xl font-black">14</span></div>
                  <div className="border border-neutral-900 bg-neutral-950 p-4 text-center text-emerald-500"><span className="text-[10px] text-neutral-500 block uppercase">Victoires</span><span className="text-xl font-black">12</span></div>
                  <div className="border border-neutral-900 bg-neutral-950 p-4 text-center text-red-500"><span className="text-[10px] text-neutral-500 block uppercase">Défaites</span><span className="text-xl font-black">2</span></div>
                  <div className="border border-neutral-900 bg-neutral-950 p-4 text-center text-yellow-500"><span className="text-[10px] text-neutral-500 block uppercase">KO / TKO</span><span className="text-xl font-black">7</span></div>
                </div>
              )}
              {subCareer !== "combats" && subCareer !== "stats" && <div className="text-xs text-neutral-500">// Section {subCareer} chargée. Aucun enregistrement trouvé.</div>}
            </div>
          )}

          {/* ========================================================= */}
          {/* M4 — ENTRAÎNEMENTS */}
          {activeModule === "training" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["planning", "sessions", "physique", "analysis"].map((tab) => (
                  <button key={tab} onClick={() => setSubTraining(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subTraining === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="border border-neutral-900 bg-neutral-950 p-4">
                <p className="text-xs uppercase text-neutral-400 font-bold mb-2">// Sous-onglet : {subTraining}</p>
                <p className="text-xs text-neutral-500 font-sans">Indicateurs de charge, musculation, cardio, sparring, intensité et constantes physiologiques (VO₂ Max, FC).</p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M5 — SANTÉ */}
          {activeModule === "health" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["examens", "blessures", "visites", "vaccins", "allergies", "medicaments"].map((tab) => (
                  <button key={tab} onClick={() => setSubHealth(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subHealth === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="border border-dashed border-neutral-900 p-6 text-center text-xs text-neutral-500">
                // Moteur CRUD Santé en attente de données : {subHealth}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M6 — NUTRITION */}
          {activeModule === "nutrition" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["programme", "repas", "hydratation", "complements"].map((tab) => (
                  <button key={tab} onClick={() => setSubNutrition(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subNutrition === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="bg-neutral-950 p-4 border border-neutral-900 text-xs font-sans space-y-2">
                <p className="text-neutral-400 font-mono text-[11px] uppercase">// APERÇU NUTRITIONNEL :</p>
                <p>• Objectif : Maintien calorique ciblé</p>
                <p>• Macronutriments : Protéines (160g) | Glucides (220g) | Lipides (70g)</p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M7 — GESTION DU POIDS */}
          {activeModule === "weight" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["history", "objectives", "curves"].map((tab) => (
                  <button key={tab} onClick={() => setSubWeight(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subWeight === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 block uppercase">Poids à la pesée</span><span className="text-lg font-bold">70.3 kg</span></div>
                <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 block uppercase">Poids actuel</span><span className="text-lg font-bold text-red-400">71.5 kg</span></div>
                <div className="border border-neutral-900 bg-neutral-950 p-4"><span className="text-[10px] text-neutral-500 block uppercase">Delta cut</span><span className="text-lg font-bold">-1.2 kg</span></div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M8 — FINANCES */}
          {activeModule === "finances" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["revenus", "depenses", "bilan", "paiements"].map((tab) => (
                  <button key={tab} onClick={() => setSubFinances(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subFinances === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="border border-neutral-900 bg-neutral-950 p-4 space-y-2 text-xs">
                <span className="text-[10px] text-neutral-500 block uppercase font-mono">// REGISTRE COMPTABLE — {subFinances}</span>
                <p className="text-neutral-400 font-sans">Primes, Bourses, Actions de Sponsoring et ventilations logistiques (Médecin, Transports, Matériel).</p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M9 — SPONSORS & CONTRATS */}
          {activeModule === "sponsors" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["sponsors", "contrats", "documents", "signature"].map((tab) => (
                  <button key={tab} onClick={() => setSubSponsors(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subSponsors === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="p-4 border border-neutral-900 bg-neutral-950 text-xs text-neutral-400">
                // Pipeline d'engagement des contrats et signatures numériques opérationnelle.
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M10 — AGENDA */}
          {activeModule === "agenda" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["calendrier", "combats", "entraînements", "pesées", "examens", "évènements"].map((tab) => (
                  <button key={tab} onClick={() => setSubAgenda(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subAgenda === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="border border-neutral-900 bg-neutral-950 p-12 text-center text-neutral-500 text-xs">
                [Calendrier Interactif Virtuel — Mode Grille]
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M11 — OBJECTIFS */}
          {activeModule === "objectives" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["objectifs", "progression", "historique"].map((tab) => (
                  <button key={tab} onClick={() => setSubObjectives(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subObjectives === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="text-xs text-neutral-400 font-sans p-4 border border-neutral-900 bg-neutral-950">
                • Titre National Poids Légers (Objectif Principal — Q3 2026) <span className="text-emerald-500 font-mono">[80%]</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M12 — MATÉRIEL */}
          {activeModule === "gear" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["inventaire", "maintenance", "remplacement"].map((tab) => (
                  <button key={tab} onClick={() => setSubGear(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subGear === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="text-xs text-neutral-500">// Inventaire CRUD : Gants de sparring, protège-tibias, bandages homologués.</div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M13 — MÉDIATHÈQUE */}
          {activeModule === "media" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["photos", "videos", "combats", "documents", "interviews"].map((tab) => (
                  <button key={tab} onClick={() => setSubMedia(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subMedia === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 h-24 text-center text-[10px] text-neutral-600 font-sans">
                <div className="border border-neutral-950 bg-neutral-950 flex items-center justify-center">[MEDIA_THUMB_01]</div>
                <div className="border border-neutral-950 bg-neutral-950 flex items-center justify-center">[MEDIA_THUMB_02]</div>
                <div className="border border-neutral-950 bg-neutral-950 flex items-center justify-center">[MEDIA_THUMB_03]</div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M14 — RÉSEAU */}
          {activeModule === "network" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["contacts", "communication", "messages", "notifications"].map((tab) => (
                  <button key={tab} onClick={() => setSubNetwork(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subNetwork === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="border border-neutral-900 bg-neutral-950 p-4 text-xs font-sans space-y-1">
                <p>• Coach Principal : Jean-Luc (Elite Team Mahajanga)</p>
                <p>• Manager : Rakoto M.</p>
                <p>• Référent Médical : Dr. Hasina (Hôpital Androva)</p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M15 — CLASSEMENTS */}
          {activeModule === "rankings" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["national", "regional", "mondial", "historique"].map((tab) => (
                  <button key={tab} onClick={() => setSubRankings(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subRankings === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="p-4 bg-neutral-950 border border-neutral-900 text-xs font-mono">
                POSITION STATISTIQUE ACTUELLE : <span className="text-yellow-500 font-bold">#1 PRO LIGHTWEIGHT MADAGASCAR</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M16 — ANALYSES (IMPRESSIONNANT) */}
          {activeModule === "analyses" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["stats", "video", "ia", "ipi"].map((tab) => (
                  <button key={tab} onClick={() => setSubAnalyses(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subAnalyses === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>

              {subAnalyses === "stats" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-neutral-950 p-3 border border-neutral-900"><span>Précision frappes</span><p className="text-lg font-bold text-neutral-200 mt-1">64%</p></div>
                  <div className="bg-neutral-950 p-3 border border-neutral-900"><span>Défense globale</span><p className="text-lg font-bold text-neutral-200 mt-1">71%</p></div>
                  <div className="bg-neutral-950 p-3 border border-neutral-900"><span>Takedown succés</span><p className="text-lg font-bold text-neutral-200 mt-1">55%</p></div>
                  <div className="bg-neutral-950 p-3 border border-neutral-900"><span>Temps moyen combat</span><p className="text-lg font-bold text-neutral-200 mt-1">6:42 min</p></div>
                </div>
              )}

              {subAnalyses === "ia" && (
                <div className="border border-neutral-900 bg-neutral-950 p-4 space-y-3 text-xs font-sans">
                  <p className="font-mono text-[11px] text-yellow-500">// PRÉVISIONS & DIAGNOSTIC DIRECT COGNITIF COCKPIT</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-2 bg-black border border-neutral-900"><span className="text-neutral-400 font-mono block">POINTS FORTS :</span> Explosivité en clinch, résistance aux amenées au sol, transitions rapides.</div>
                    <div className="p-2 bg-black border border-neutral-900"><span className="text-neutral-400 font-mono block">POINTS FAIBLES :</span> Exposition aux low-kicks en début de premier round.</div>
                  </div>
                </div>
              )}

              {subAnalyses === "ipi" && (
                <div className="border border-neutral-900 bg-neutral-950 p-6 text-center max-w-sm mx-auto">
                  <span className="text-[10px] text-neutral-500 block uppercase font-mono">INDICE DE PERFORMANCE INDESY ACTUEL</span>
                  <div className="text-3xl font-black text-emerald-500 my-2">89.2 / 100</div>
                  <span className="text-[10px] text-neutral-400 font-sans">+2.4 points d'évolution sur les 30 derniers jours</span>
                </div>
              )}
              {subAnalyses === "video" && <div className="text-xs text-neutral-500">// Module d'annotation, ralentis et import de combat actif.</div>}
            </div>
          )}

          {/* ========================================================= */}
          {/* M17 — MARKETPLACE */}
          {activeModule === "marketplace" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["annonces", "ventes", "services", "stats"].map((tab) => (
                  <button key={tab} onClick={() => setSubMarket(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subMarket === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="border border-neutral-900 bg-neutral-950 p-4 text-xs">
                // Tunnel de monétisation de services d'entraînement ou ventes de merchandising athlète.
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M18 — RÉSEAUX SOCIAUX */}
          {activeModule === "socials" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["comptes", "publications", "programmation", "stats"].map((tab) => (
                  <button key={tab} onClick={() => setSubSocials(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subSocials === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="text-xs text-neutral-500">// API de planification et indicateurs de portée sociale.</div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M19 — ADMINISTRATION */}
          {activeModule === "admin" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["documents", "licences", "assurances", "identite"].map((tab) => (
                  <button key={tab} onClick={() => setSubAdmin(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subAdmin === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="border border-neutral-900 bg-neutral-950 p-4 space-y-2 text-xs font-sans">
                <span className="text-[10px] text-neutral-500 font-mono block">// REGISTRE LEGAL DES PIECES IDENTITAIRES (CRUD)</span>
                <p>• Passeport Malagasy : <span className="text-emerald-500 font-mono">VALIDE</span></p>
                <p>• CIN Numérique : <span className="text-emerald-500 font-mono">VALIDE</span></p>
                <p>• Assurance sportive FMM : <span className="text-red-500 font-mono">EXPIRATION PROCHE</span></p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* M20 — PARAMÈTRES */}
          {activeModule === "settings" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-900 pb-px">
                {["compte", "securite", "notifications", "confidentialite", "preferences"].map((tab) => (
                  <button key={tab} onClick={() => setSubSettings(tab as any)} className={`h-8 px-3 text-[11px] uppercase tracking-wider font-bold border-t border-x transition-all ${subSettings === tab ? "bg-neutral-950 text-yellow-500 border-neutral-900 font-black" : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-300"}`}>{tab}</button>
                ))}
              </div>
              <div className="text-xs text-neutral-500">// Préférences système du tableau de bord.</div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}