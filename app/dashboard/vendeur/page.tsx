"use client"

import React, { useState, createContext, useContext } from "react"
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  Award, 
  Clock, 
  BarChart3, 
  FileSpreadsheet, 
  Wallet, 
  Wrench, 
  HeartPulse, 
  GraduationCap, 
  MessageSquare, 
  PieChart, 
  Scale,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  ChevronRight,
  UserCheck,
  Check,
  Download,
  Filter,
  Plus
} from "lucide-react"
// Context pour les popups d'interaction
interface PopupState {
  title: string
  message: string
  type: "info" | "success" | "warning"
}

const PopupContext = createContext<{ showPopup: (p: PopupState) => void }>({ showPopup: () => {} })

function BrandPopup({ popup, setPopup }: { popup: PopupState | null, setPopup: (p: PopupState | null) => void }) {
  if (!popup) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 max-w-md w-full p-6 space-y-4 relative shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            {popup.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            {popup.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            {popup.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">{popup.title}</h3>
          </div>
          <button onClick={() => setPopup(null)} className="text-zinc-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-mono">{popup.message}</p>
        <div className="flex justify-end pt-2">
          <button onClick={() => setPopup(null)} className="px-4 py-2 bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 uppercase tracking-wider">
            Compris
          </button>
        </div>
      </div>
    </div>
  )
}

// Sous-composants des Modules Fédéraux Indesy Mialy
function OverviewModule() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-zinc-900 border border-zinc-800 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Arbitres Actifs</span>
          <div className="text-2xl font-black text-white">42</div>
          <div className="text-[10px] text-emerald-500 flex items-center gap-1">↑ +3 ce mois (Madagascar)</div>
        </div>
        <div className="p-5 bg-zinc-900 border border-zinc-800 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Combats Certifiés</span>
          <div className="text-2xl font-black text-amber-500">128</div>
          <div className="text-[10px] text-zinc-400">Saison 2026 FMMADA</div>
        </div>
        <div className="p-5 bg-zinc-900 border border-zinc-800 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Désignations en cours</span>
          <div className="text-2xl font-black text-white">14</div>
          <div className="text-[10px] text-blue-400">Prêts pour validation</div>
        </div>
        <div className="p-5 bg-zinc-900 border border-zinc-800 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Indemnités Validées</span>
          <div className="text-2xl font-black text-emerald-400">4 750 000 Ar</div>
          <div className="text-[10px] text-zinc-400">Tranche MFN V</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Prochains Événements Officiels</h3>
            <span className="text-xs text-zinc-500 font-mono">Mahajanga / Antananarivo</span>
          </div>
          <div className="space-y-2">
            {[
              { title: "Championnat National MMA - Éliminatoires", date: "05 Août 2026", loc: "Mahajanga Arena", status: "Confirmé" },
              { title: "Séminaire de Recyclage Arbitres Judo", date: "18 Août 2026", loc: "Institut National", status: "Ouvert" },
              { title: "Gala International Indesy Mialy", date: "30 Septembre 2026", loc: "Ankorondrano Tana", status: "En attente" }
            ].map((ev, i) => (
              <div key={i} className="p-3 bg-zinc-950 border border-zinc-850 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{ev.title}</div>
                  <div className="text-zinc-500 mt-0.5">{ev.date} • {ev.loc}</div>
                </div>
                <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-amber-500 font-mono text-[10px]">{ev.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Alertes & Rappels</h3>
          <div className="space-y-3 text-xs text-zinc-300">
            <div className="p-3 bg-zinc-950 border border-zinc-850 space-y-1">
              <span className="text-[10px] text-amber-500 font-mono font-bold">CERTIFICAT MÉDICAL</span>
              <p>5 arbitres doivent renouveler leur aptitude avant le 10 août.</p>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-850 space-y-1">
              <span className="text-[10px] text-emerald-500 font-mono font-bold">RÈGLEMENTATION</span>
              <p>Mise à jour des grilles de notation MMA disponible.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DesignationsModule() {
  const { showPopup } = useContext(PopupContext)
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Gestion des Désignations Officielles</h3>
        <button onClick={() => showPopup({ title: "Nouvelle Désignation", message: "Formulaire d'assignation d'officiel ouvert.", type: "info" })} className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold uppercase">Assigner</button>
      </div>
      <div className="border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-800">
            <tr>
              <th className="p-3">ID Match</th>
              <th className="p-3">Événement</th>
              <th className="p-3">Arbitre Principal</th>
              <th className="p-3">Juges de Ring</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850 text-zinc-300">
            <tr>
              <td className="p-3 font-mono text-amber-500">#MMA-206</td>
              <td className="p-3">Tournoi Mahajanga Open</td>
              <td className="p-3 font-bold text-white">Rakoto Jean</td>
              <td className="p-3 text-zinc-400">Andria M., Be N.</td>
              <td className="p-3"><span className="text-emerald-500 font-mono text-[10px]">Validé</span></td>
            </tr>
            <tr>
              <td className="p-3 font-mono text-amber-500">#JUD-112</td>
              <td className="p-3">Coupe Nationale Cadets</td>
              <td className="p-3 font-bold text-white">Rasoanaivo H.</td>
              <td className="p-3 text-zinc-400">Kolo P., Randria T.</td>
              <td className="p-3"><span className="text-amber-500 font-mono text-[10px]">En attente</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HistoriqueModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Historique Complet des Combats & Arbitrages</h3>
      <p className="text-xs text-zinc-400">Registre officiel archivé des performances et décisions arbitrales de la plateforme.</p>
      <div className="space-y-2">
        {[
          { id: "CB-902", discipline: "MMA", vainqueur: "Berthier 'The Lion'", duree: "R2 - 2:14", arbitre: "Rakoto Jean" },
          { id: "CB-901", discipline: "Judo", vainqueur: "Zafy Marc (Ippon)", duree: "R1 - 1:45", arbitre: "Rasoanaivo H." }
        ].map((c, i) => (
          <div key={i} className="p-3 bg-zinc-950 border border-zinc-850 flex justify-between items-center text-xs">
            <div>
              <span className="font-mono text-amber-500 mr-2">{c.id}</span>
              <span className="font-bold text-white">{c.discipline} • {c.vainqueur}</span>
            </div>
            <div className="text-zinc-400 text-right">
              <div>{c.duree}</div>
              <div className="text-[10px] text-zinc-500">Arbitre: {c.arbitre}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReglementsModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Règlements & Codes Officiels</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-zinc-950 border border-zinc-850 space-y-2">
          <div className="font-bold text-white uppercase">Code Sportif MMA FMMADA</div>
          <p className="text-zinc-400">Normes unifiées de l'arbitrage, catégories de poids, équipements obligatoires et fautes graves.</p>
          <span className="text-amber-500 font-mono text-[10px] block">PDF • 2.4 Mo</span>
        </div>
        <div className="p-4 bg-zinc-950 border border-zinc-850 space-y-2">
          <div className="font-bold text-white uppercase">Règlement International Judo</div>
          <p className="text-zinc-400">Application des critères de notation IJF, restrictions de saisie et arbitrage vidéo.</p>
          <span className="text-amber-500 font-mono text-[10px] block">PDF • 1.8 Mo</span>
        </div>
      </div>
    </div>
  )
}

function CertifsModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Suivi des Certifications Fédérales</h3>
      <p className="text-xs text-zinc-400">Validation des diplômes d'arbitres, juges et commissaires sportifs.</p>
      <div className="p-4 bg-zinc-950 border border-zinc-850 text-xs flex justify-between items-center">
        <div>
          <div className="font-bold text-white">Licence Nationale Arbitre Grade A</div>
          <div className="text-zinc-500">Titulaire: Administration Indesy Mialy</div>
        </div>
        <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px]">Actif</span>
      </div>
    </div>
  )
}

function DisposModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Calendrier & Disponibilités du Corps Arbitral</h3>
      <p className="text-xs text-zinc-400">Gestion des plannings d'indisponibilité pour la saison en cours.</p>
      <div className="p-4 bg-zinc-950 border border-zinc-850 text-xs text-zinc-300">
        Aucun congé ou indisponibilité enregistré pour le mois d'août 2026. Corps arbitral pleinement opérationnel.
      </div>
    </div>
  )
}

function EvaluationsModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Évaluations & Notes des Officiers</h3>
      <div className="space-y-2 text-xs">
        <div className="p-3 bg-zinc-950 border border-zinc-850 flex justify-between items-center">
          <div>
            <span className="font-bold text-white">Rakoto Jean</span>
            <span className="text-zinc-500 ml-2">Arbitre MMA</span>
          </div>
          <span className="text-amber-500 font-mono">Note: 4.8 / 5.0</span>
        </div>
      </div>
    </div>
  )
}

function RapportsModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Rapports d'Incidents & Fiches Matchs</h3>
      <p className="text-xs text-zinc-400">Soumission et consultation des rapports officiels post-combat.</p>
      <div className="p-4 bg-zinc-950 border border-zinc-850 text-xs text-zinc-400">
        Aucun incident majeur signalé lors des 10 derniers événements de Mahajanga.
      </div>
    </div>
  )
}

function FinancesModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Finances & Indemnisations Officielles</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-zinc-950 border border-zinc-850 space-y-1">
          <span className="text-zinc-500 uppercase font-mono text-[10px]">Budget Alloué</span>
          <div className="text-lg font-black text-white">15 000 000 Ar</div>
        </div>
        <div className="p-4 bg-zinc-950 border border-zinc-850 space-y-1">
          <span className="text-zinc-500 uppercase font-mono text-[10px]">Indemnités Versées</span>
          <div className="text-lg font-black text-amber-500">4 750 000 Ar</div>
        </div>
        <div className="p-4 bg-zinc-950 border border-zinc-850 space-y-1">
          <span className="text-zinc-500 uppercase font-mono text-[10px]">Solde Disponible</span>
          <div className="text-lg font-black text-emerald-400">10 250 000 Ar</div>
        </div>
      </div>
    </div>
  )
}

function MaterielModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Inventaire du Matériel Fédéral</h3>
      <div className="space-y-2 text-xs">
        {["Gants officiels MMA homologués (10 paires)", "Tatamis haute densité (100m²)", "Chronomètres officiels et sonnette", "Kits premiers secours d'urgence"].map((m, i) => (
          <div key={i} className="p-3 bg-zinc-950 border border-zinc-850 flex justify-between items-center text-zinc-300">
            <span>{m}</span>
            <span className="text-emerald-500 font-mono text-[10px]">En stock / Bon état</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MedicalModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Suivi Médical & Suspensions</h3>
      <p className="text-xs text-zinc-400">Registre des suspensions médicales post-KO ou blessures (Judo & MMA).</p>
      <div className="p-4 bg-zinc-950 border border-zinc-850 text-xs text-zinc-400">
        Aucune suspension médicale active à ce jour.
      </div>
    </div>
  )
}

function FormationModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Formations & Séminaires Continus</h3>
      <p className="text-xs text-zinc-400">Modules de formation continue pour les entraîneurs et arbitres malagasy.</p>
      <div className="p-4 bg-zinc-950 border border-zinc-850 text-xs space-y-1">
        <div className="font-bold text-white">Module 1: Arbitrage Vidéo et VAR en MMA</div>
        <div className="text-zinc-500">Statut: En ligne • 12 inscrits</div>
      </div>
    </div>
  )
}

function CommunicationModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Communication & Circulaires Fédérales</h3>
      <p className="text-xs text-zinc-400">Diffusion des notes de service officielles aux clubs affiliés.</p>
      <div className="p-4 bg-zinc-950 border border-zinc-850 text-xs space-y-1">
        <div className="font-bold text-amber-500">Circulaire N° 04/2026/FMMADA</div>
        <div className="text-zinc-300">Nouvelles dispositions relatives aux pesées officielles avant combat.</div>
      </div>
    </div>
  )
}

function StatistiquesModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Statistiques Avancées & Analytique</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-zinc-950 border border-zinc-850 space-y-2">
          <div className="font-bold text-white uppercase">Répartition des Victoires (MMA)</div>
          <div className="text-zinc-400 space-y-1">
            <div>• Soumission: 42%</div>
            <div>• KO / TKO: 38%</div>
            <div>• Décision des Juges: 20%</div>
          </div>
        </div>
        <div className="p-4 bg-zinc-950 border border-zinc-850 space-y-2">
          <div className="font-bold text-white uppercase">Répartition des Victoires (Judo)</div>
          <div className="text-zinc-400 space-y-1">
            <div>• Ippon direct: 65%</div>
            <div>• Waza-ari: 25%</div>
            <div>• Pénalités (Shido): 10%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function JugementModule() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Module Central de Jugement & Scoring en Direct</h3>
      <p className="text-xs text-zinc-400">Interface de notation officielle connectée aux rings de compétition.</p>
      <div className="p-4 bg-zinc-950 border border-zinc-850 text-center space-y-3">
        <div className="text-amber-500 font-mono text-xs font-bold uppercase">Ring Principal • Connecté</div>
        <div className="text-2xl font-black text-white">ROUGE 29 - 28 BLEU</div>
        <div className="text-[10px] text-zinc-500 font-mono">Round 3 en cours • 01:12</div>
      </div>
    </div>
  )
}

// Composant Principal
export default function IndesyMialyPlatform() {
  const [active, setActive] = useState("overview")
  const [popup, setPopup] = useState<PopupState | null>(null)

  const showPopup = (p: PopupState) => setPopup(p)

  const menu = [
    { id: "overview", label: "Vue d'ensemble", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "designations", label: "Désignations", icon: <ShieldCheck className="h-4 w-4" /> },
    { id: "historique", label: "Historique", icon: <Calendar className="h-4 w-4" /> },
    { id: "reglements", label: "Règlements", icon: <FileText className="h-4 w-4" /> },
    { id: "certifs", label: "Certifications", icon: <Award className="h-4 w-4" /> },
    { id: "dispos", label: "Disponibilités", icon: <Clock className="h-4 w-4" /> },
    { id: "evaluations", label: "Évaluations", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "rapports", label: "Rapports", icon: <FileSpreadsheet className="h-4 w-4" /> },
    { id: "finances", label: "Finances", icon: <Wallet className="h-4 w-4" /> },
    { id: "materiel", label: "Matériel", icon: <Wrench className="h-4 w-4" /> },
    { id: "medical", label: "Médical", icon: <HeartPulse className="h-4 w-4" /> },
    { id: "formation", label: "Formation", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "communication", label: "Communication", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "stats", label: "Statistiques", icon: <PieChart className="h-4 w-4" /> },
    { id: "jugement", label: "Jugement en Direct", icon: <Scale className="h-4 w-4" /> },
  ]

  return (
    <PopupContext.Provider value={{ showPopup }}>
      <div className="min-h-screen bg-black text-zinc-100 flex font-sans selection:bg-amber-500 selection:text-black">
        
        {/* Sidebar de navigation */}
        <aside className="w-72 border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0">
          <div className="p-6 border-b border-zinc-900">
            <div className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-2">
              <span className="h-3 w-3 bg-amber-500 inline-block" />
              INDESY MIALY
            </div>
            <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-widest">Plateforme Officielle FMMADA</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {menu.map((m) => {
              const isActive = active === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setActive(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors text-left ${
                    isActive 
                      ? "bg-amber-500/10 text-amber-500 border-l-2 border-amber-500 font-bold" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                  }`}
                >
                  {m.icon}
                  <span className="truncate">{m.label}</span>
                </button>
              )
            })}
          </div>

          <div className="p-4 border-t border-zinc-900">
            <div className="p-3 bg-zinc-900 border border-zinc-800 space-y-1 text-[11px]">
              <div className="font-bold text-white uppercase">Mahajanga Hub</div>
              <div className="text-zinc-500">Statut: Connecté au réseau central</div>
            </div>
          </div>
        </aside>

        {/* Contenu Principal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          <header className="h-16 border-b border-zinc-900 bg-zinc-950 px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4 w-96">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                <input 
                  type="text" 
                  placeholder="Rechercher un combat, un arbitre, un règlement..." 
                  className="w-full bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => showPopup({ title: "Notifications Fédérales", message: "• Convocation séminaire 28 Août reçue\n• Virement indemnité MFN V validé (470 000 Ar)\n• Alerte: certif médical à renouveler dans 14j", type: "info" })} className="relative h-9 w-9 border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              </button>
              <div className="h-9 w-9 border border-zinc-800 bg-zinc-900 flex items-center justify-center font-bold text-xs text-amber-500">AR</div>
            </div>
          </header>

          <main className="p-8 max-w-[1600px] w-full mx-auto space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
              <div>
                <h2 className="text-xl font-black uppercase text-white tracking-wider flex items-center gap-2">
                  {menu.find(m => m.id === active)?.icon}
                  {menu.find(m => m.id === active)?.label}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Espace Officiel Fédéral Indesy Mialy • Gestion et arbitrage de combats certifiés</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">Dernière synchro: À l'instant</span>
                <button onClick={() => showPopup({ title: "Synchronisation", message: "Toutes les données sont à jour avec la base centrale FMMADA.", type: "success" })} className="h-8 px-3 bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-bold hover:bg-zinc-850">Sync Cloud</button>
              </div>
            </div>

            {active === "overview" && <OverviewModule />}
            {active === "designations" && <DesignationsModule />}
            {active === "historique" && <HistoriqueModule />}
            {active === "reglements" && <ReglementsModule />}
            {active === "certifs" && <CertifsModule />}
            {active === "dispos" && <DisposModule />}
            {active === "evaluations" && <EvaluationsModule />}
            {active === "rapports" && <RapportsModule />}
            {active === "finances" && <FinancesModule />}
            {active === "materiel" && <MaterielModule />}
            {active === "medical" && <MedicalModule />}
            {active === "formation" && <FormationModule />}
            {active === "communication" && <CommunicationModule />}
            {active === "stats" && <StatistiquesModule />}
            {active === "jugement" && <JugementModule />}
          </main>
        </div>

        <BrandPopup popup={popup} setPopup={setPopup} />
      </div>
    </PopupContext.Provider>
  )
}