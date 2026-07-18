"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, User, Trophy, Swords, Mail, Dumbbell, HeartPulse, Scale, Wallet, FileText,
  Search, Bell, Calendar, MapPin, X, ArrowUpRight, Activity, Shield, Flame, Upload, Eye
} from "lucide-react"

type FighterModule = "overview" | "profil" | "palmares" | "combats" | "invitations" | "entrainements" | "medical" | "poids" | "finances" | "documents"
type PopupType = "info" | "success" | "warning" | "confirm" | "prompt"

interface PopupState { 
  open: boolean; 
  title: string; 
  message: string; 
  type: PopupType; 
  confirmText?: string; 
  cancelText?: string; 
  onConfirm?: (...a: any[]) => void; 
  onCancel?: () => void; 
  showInput?: boolean; 
  inputPlaceholder?: string; 
  inputValue?: string 
}

interface PopupContextType {
  showPopup: (o: { title: string; message: string; type?: PopupType }) => void;
  showConfirm: (o: { title: string; message: string; confirmText?: string; onConfirm: () => void; onCancel?: () => void }) => void;
  showDoublePrompt: (o: { title: string; message: string; firstPlaceholder?: string; secondPlaceholder?: string; onConfirm: (val: string) => void }) => void;
  showPrompt: (o: { title: string; message: string; firstPlaceholder?: string; secondPlaceholder?: string; onConfirm: (val: string) => void }) => void;
}

const PopupContext = createContext<PopupContextType | null>(null)

function BrandPopup({ popup, setPopup }: { popup: PopupState; setPopup: React.Dispatch<React.SetStateAction<PopupState>> }) {
  const [input, setInput] = useState("")
  
  useEffect(() => { 
    if (popup.open) setInput(popup.inputValue || "") 
  }, [popup.open, popup.inputValue])
  
  if (!popup.open) return null
  
  const close = () => setPopup((p) => ({ ...p, open: false }))
  const ok = () => { 
    if (popup.showInput && !input.trim()) return; 
    popup.onConfirm?.(input.trim()); 
    close() 
  }
  const cancel = () => { 
    popup.onCancel?.(); 
    close() 
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancel} />
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden rounded-sm">
        <div className="h-1 w-full bg-amber-500" />
        <div className="p-3.5">
          <div className="flex justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 bg-amber-500 text-black font-black text-xs flex items-center justify-center">IM</div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Indesy Mialy</span>
            </div>
            <button onClick={cancel} className="text-zinc-600 hover:text-zinc-300">
              <X className="h-3 w-3" />
            </button>
          </div>
          <h4 className="mt-3 text-[11.5px] font-bold uppercase text-white">{popup.title}</h4>
          <p className="mt-1 text-xs leading-[1.5] text-zinc-400 whitespace-pre-wrap">{popup.message}</p>
          
          {popup.showInput && (
            <input 
              autoFocus 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder={popup.inputPlaceholder} 
              className="mt-3 h-8 w-full bg-zinc-900 border border-zinc-800 px-2.5 text-xs text-white outline-none focus:border-amber-500/50" 
            />
          )}
          
          <div className="mt-3.5 flex justify-end gap-1.5">
            {(popup.type === "confirm" || popup.showInput) && (
              <button onClick={cancel} className="h-7 px-3 text-[10.5px] border border-zinc-800 text-zinc-400 hover:bg-zinc-900 transition">
                {popup.cancelText || "Annuler"}
              </button>
            )}
            <button onClick={ok} className="h-7 px-3 text-[10.5px] font-bold bg-amber-500 text-black hover:bg-amber-600 transition">
              {popup.confirmText || "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// MODULES
function OverviewModule() {
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase font-bold text-zinc-500">Record Pro</p><p className="mt-1 text-xl font-black text-white">8 - 2 - 0</p><p className="mt-1 text-xs text-emerald-400 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />3 victoires consécutives</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase font-bold text-zinc-500">Prochain Combat</p><p className="mt-1 text-sm font-bold text-white">vs Razafy 'King'</p><p className="text-xs text-zinc-500">15 Août • Gymnase Mahajanga</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase font-bold text-zinc-500">Poids Actuel</p><p className="mt-1 text-xl font-black text-white">83.4 kg</p><p className="text-xs text-amber-400">Cible 77 kg (-6.4 kg)</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase font-bold text-zinc-500">Licence</p><p className="mt-1 text-sm font-bold text-emerald-400">Valide</p><p className="text-xs text-zinc-500">Expire 12/2026</p></div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Flame className="h-4 w-4 text-amber-500" />Alerte Action Requise</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-3">
              <span className="text-xs text-amber-200">Certificat médical à renouveler dans 8 jours</span>
              <button onClick={() => ctx?.showPopup({ title: "Médical", message: "Upload ton nouveau certificat", type: "warning" })} className="text-xs font-bold text-amber-400 underline">Régulariser</button>
            </div>
            <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-3">
              <span className="text-xs text-zinc-400">Invitation combat - Mahajanga Fight Night VI</span>
              <button onClick={() => ctx?.showConfirm({ title: "Accepter le combat?", message: "Poids -77kg vs Andry T. le 15/08", confirmText: "Accepter", onConfirm: () => ctx?.showPopup({ title: "Accepté", message: "Contrat envoyé au promoteur", type: "success" }) })} className="h-6 px-2.5 bg-amber-500 text-black text-xs font-bold">Voir</button>
            </div>
          </div>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-5"><h3 className="text-sm font-bold text-white">Camp en cours</h3><p className="text-xs text-zinc-500 mt-1">Tiger Combat Academy • 6 sem.</p><div className="mt-3 h-1.5 w-full bg-zinc-900"><div className="h-full bg-amber-500" style={{ width: "68%" }} /></div><p className="mt-2 text-xs text-zinc-500">68% complété • 12 séances restantes</p></div>
      </div>
    </div>
  )
}

function ProfilModule() { 
  const ctx = useContext(PopupContext); 
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="border border-zinc-900 bg-zinc-950 p-5 md:col-span-1">
        <div className="h-24 w-24 bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-2xl font-black text-zinc-600">RT</div>
        <h3 className="mt-4 text-center text-sm font-bold text-white">Rakoto 'The Giant' T.</h3>
        <p className="text-center text-xs text-zinc-500">Alpha MMA Mahajanga • -77kg</p>
        <button onClick={() => ctx?.showPopup({ title: "Profil", message: "Édition du profil bientôt", type: "info" })} className="mt-4 w-full h-8 border border-zinc-800 bg-zinc-900/50 text-xs font-bold text-zinc-300">Modifier le profil</button>
      </div>
      <div className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div><p className="text-xs uppercase font-bold text-zinc-500">Garde</p><p className="text-white font-bold">Orthodoxe</p></div>
          <div><p className="text-xs uppercase font-bold text-zinc-500">Allonge</p><p className="text-white">182 cm</p></div>
          <div><p className="text-xs uppercase font-bold text-zinc-500">Taille</p><p className="text-white">178 cm</p></div>
          <div><p className="text-xs uppercase font-bold text-zinc-500">Catégorie</p><p className="text-white">Welter -77kg</p></div>
        </div>
        <div className="pt-4 border-t border-zinc-900">
          <p className="text-xs uppercase font-bold text-zinc-500">Disciplines</p>
          <div className="mt-2 flex gap-1.5">
            <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">MMA</span>
            <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">Lutte</span>
            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">Jiu-Jitsu</span>
          </div>
        </div>
      </div>
    </div>
  ) 
}

function PalmaresModule() { 
  return (
    <div className="border border-zinc-900 bg-zinc-950 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-zinc-900/30 border-b border-zinc-900 text-xs uppercase font-bold text-zinc-500">
            <th className="p-3">Date</th>
            <th className="p-3">Adversaire</th>
            <th className="p-3">Résultat</th>
            <th className="p-3">Méthode</th>
            <th className="p-3">Event</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900 text-xs">
          {[{ d: "12/04/2026", adv: "Sitraka R.", res: "Victoire", met: "TKO R2", ev: "MFN IV" }, 
            { d: "08/02/2026", adv: "Guillaume B.", res: "Victoire", met: "Décision", ev: "MFN III" }, 
            { d: "11/11/2025", adv: "Andry T.", res: "Défaite", met: "Soumission", ev: "Open Nosy Be" }
          ].map((r) => (
            <tr key={r.d} className="hover:bg-zinc-900/20">
              <td className="p-3 text-zinc-400">{r.d}</td>
              <td className="p-3 font-bold text-white">{r.adv}</td>
              <td className={`p-3 font-bold ${r.res === "Victoire" ? "text-emerald-400" : "text-red-400"}`}>{r.res}</td>
              <td className="p-3 text-zinc-400">{r.met}</td>
              <td className="p-3 text-zinc-500">{r.ev}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) 
}

function CombatsModule() { 
  const ctx = useContext(PopupContext); 
  return (
    <div className="space-y-3">
      {[{ name: "MFN VI - vs Andry T.", date: "15 Août 2026", status: "Confirmé", loc: "Mahajanga" }, 
        { name: "Nosy Be Open - Finale", date: "02 Sept 2026", status: "En attente", loc: "Nosy Be" }
      ].map((c) => (
        <div key={c.name} className="flex justify-between items-center border border-zinc-900 bg-zinc-950 p-4">
          <div>
            <p className="text-sm font-bold text-white">{c.name}</p>
            <p className="text-xs text-zinc-500 flex items-center gap-2"><Calendar className="h-3 w-3" />{c.date} • <MapPin className="h-3 w-3" />{c.loc}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-bold uppercase ${c.status === "Confirmé" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{c.status}</span>
            <button onClick={() => ctx?.showPopup({ title: c.name, message: "Détails du fight camp et contrat", type: "info" })} className="h-7 w-7 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition"><Eye className="h-3 w-3" /></button>
          </div>
        </div>
      ))}
    </div>
  ) 
}

function InvitationsModule() { 
  const ctx = useContext(PopupContext); 
  return (
    <div className="grid gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="border border-amber-500/20 bg-amber-500/5 p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-white">Défi reçu de Rova K. (-77kg)</p>
            <p className="text-xs text-zinc-400">Bourse proposée: 800 000 Ar + prime KO</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => ctx?.showPopup({ title: "Refusé", message: "Invitation déclinée", type: "info" })} className="h-7 px-3 border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-900 transition">Décliner</button>
            <button onClick={() => ctx?.showConfirm({ title: "Accepter le défi?", message: "Signature du contrat préliminaire", confirmText: "Accepter", onConfirm: () => ctx?.showPopup({ title: "Accepté", message: "Manager notifié", type: "success" }) })} className="h-7 px-3 bg-amber-500 text-black text-xs font-bold hover:bg-amber-600 transition">Accepter</button>
          </div>
        </div>
      ))}
    </div>
  ) 
}

function EntrainementsModule() { 
  return (
    <div className="border border-zinc-900 bg-zinc-950 p-5">
      <h3 className="text-sm font-bold text-white flex items-center gap-2"><Dumbbell className="h-4 w-4 text-amber-500" />Planning Hebdo</h3>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
        {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d) => (
          <div key={d} className="border border-zinc-800 bg-zinc-900/30 p-2">
            <p className="font-bold text-zinc-400">{d}</p>
            <p className="mt-2 text-[11px] text-white">MMA • 18h</p>
            <p className="text-[10px] text-zinc-500">Sparring</p>
          </div>
        ))}
      </div>
    </div>
  ) 
}

function MedicalModule() { 
  const ctx = useContext(PopupContext); 
  return (
    <div className="space-y-3">
      <div className="border border-zinc-900 bg-zinc-950 p-4 flex justify-between items-center">
        <div>
          <p className="text-sm font-bold text-white">Certificat médical aptitude combat</p>
          <p className="text-xs text-zinc-500">Expire le 23/08/2026 • PDF validé</p>
        </div>
        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase">Valide</span>
      </div>
      <button onClick={() => ctx?.showPopup({ title: "Upload", message: "Module upload médical", type: "info" })} className="w-full h-10 border border-dashed border-zinc-700 bg-zinc-900/20 text-xs text-zinc-400 flex items-center justify-center gap-2 hover:bg-zinc-900/40 transition">
        <Upload className="h-4 w-4" />Téléverser nouveau document
      </button>
    </div>
  ) 
}

function PoidsModule() { 
  return (
    <div className="border border-zinc-900 bg-zinc-950 p-5">
      <h3 className="text-sm font-bold text-white flex items-center gap-2"><Scale className="h-4 w-4 text-amber-500" />Suivi Weight Cut</h3>
      <div className="mt-4 flex items-end gap-1 h-24 border-b border-zinc-900 pb-1">
        {[82, 83, 82.5, 84, 83.4, 83, 82.8].map((v, i) => (
          <div key={i} className="flex-1 bg-zinc-800 transition-all hover:bg-zinc-700" style={{ height: `${(v - 75) * 8}px` }}>
            <div className="w-full bg-amber-500" style={{ height: "40%" }} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-500">Objectif 77kg pour le 15 Août • Hydratation 62% • Suivi quotidien requis</p>
    </div>
  ) 
}

function FinancesModule() { 
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase text-zinc-500">Gains totaux</p><p className="text-xl font-black text-white mt-1">6 200 000 Ar</p></div>
      <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase text-zinc-500">En attente</p><p className="text-xl font-black text-amber-400 mt-1">1 400 000 Ar</p></div>
      <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase text-zinc-500">Prochaine bourse</p><p className="text-sm font-bold text-white mt-1">800 000 Ar + 200k KO</p></div>
    </div>
  ) 
}

function DocumentsModule() { 
  const ctx = useContext(PopupContext); 
  return (
    <div className="space-y-2">
      {[{ name: "Contrat MFN VI.pdf", status: "À signer" }, { name: "Licence FMMADA 2026.pdf", status: "Signé" }].map((d) => (
        <div key={d.name} className="flex justify-between items-center border border-zinc-900 bg-zinc-950 p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-sm font-bold text-white">{d.name}</p>
              <p className={`text-xs uppercase font-bold ${d.status === "À signer" ? "text-amber-400" : "text-emerald-400"}`}>{d.status}</p>
            </div>
          </div>
          <button onClick={() => ctx?.showPopup({ title: d.name, message: d.status === "À signer" ? "Signature électronique" : "Téléchargement", type: "info" })} className="h-7 px-3 border border-zinc-800 text-xs hover:bg-zinc-900 transition">{d.status === "À signer" ? "Signer" : "Voir"}</button>
        </div>
      ))}
    </div>
  ) 
}

export default function CombattantDashboard() {
  const [active, setActive] = useState<FighterModule>("overview")
  const [search, setSearch] = useState("")
  const [popup, setPopup] = useState<PopupState>({ open: false, title: "", message: "", type: "info" })
  
  const showPopup = (o: any) => setPopup({ open: true, title: o.title || "Info", message: o.message, type: o.type || "info", confirmText: "Fermer" })
  const showConfirm = (o: any) => setPopup({ open: true, title: o.title || "Confirmation", message: o.message, type: "confirm", confirmText: o.confirmText || "Confirmer", cancelText: "Annuler", onConfirm: o.onConfirm, onCancel: o.onCancel })
  const showDoublePrompt = (o: any) => setPopup({ open: true, title: o.title, message: o.message, type: "prompt", showInput: true, inputPlaceholder: o.firstPlaceholder, confirmText: "Ajouter", cancelText: "Annuler", onConfirm: o.onConfirm })

  const menu = [
    { id: "overview" as FighterModule, label: "Vue d'ensemble", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "profil" as FighterModule, label: "Mon Profil", icon: <User className="h-5 w-5" /> },
    { id: "palmares" as FighterModule, label: "Palmarès & Stats", icon: <Trophy className="h-5 w-5" /> },
    { id: "combats" as FighterModule, label: "Mes Combats", icon: <Swords className="h-5 w-5" /> },
    { id: "invitations" as FighterModule, label: "Invitations / Défis", icon: <Mail className="h-5 w-5" />, badge: "2" },
    { id: "entrainements" as FighterModule, label: "Entraînements", icon: <Dumbbell className="h-5 w-5" /> },
    { id: "medical" as FighterModule, label: "Médical & Pesée", icon: <HeartPulse className="h-5 w-5" /> },
    { id: "poids" as FighterModule, label: "Suivi Poids", icon: <Scale className="h-5 w-5" /> },
    { id: "finances" as FighterModule, label: "Bourses & Gains", icon: <Wallet className="h-5 w-5" /> },
    { id: "documents" as FighterModule, label: "Contrats & Docs", icon: <FileText className="h-5 w-5" /> },
  ]

  return (
    <PopupContext.Provider value={{ showPopup, showConfirm, showDoublePrompt, showPrompt: showDoublePrompt }}>
      <div className="flex min-h-screen bg-black text-zinc-100">
        
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center gap-3 px-2 py-3 border-b border-zinc-900">
              <div className="h-9 w-9 bg-amber-500 text-black font-black flex items-center justify-center rounded-sm">IM</div>
              <div>
                <h1 className="text-sm font-black uppercase tracking-tight">INDESY MIALY</h1>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block">Espace Combattant</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 border border-zinc-900 bg-zinc-900/30 p-3 rounded-sm">
              <div className="h-10 w-10 bg-zinc-800 flex items-center justify-center font-black text-white rounded-full">RT</div>
              <div>
                <p className="text-xs font-bold text-white">Rakoto T.</p>
                <p className="text-[10px] text-zinc-500">Welter • 8-2 • Alpha MMA</p>
              </div>
            </div>
            <nav className="mt-6 space-y-1">
              {menu.map((it) => (
                <button 
                  key={it.id} 
                  onClick={() => setActive(it.id)} 
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium border-l-2 transition-all ${
                    active === it.id
                      ? "bg-amber-500/10 text-amber-400 border-amber-500" 
                      : "text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <span className="flex items-center gap-3">{it.icon}{it.label}</span>
                  {it.badge && (
                    <span className="h-4 min-w-4 px-1 bg-amber-500 text-black text-[10px] font-black flex items-center justify-center rounded-full">
                      {it.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/20 p-3 rounded-sm">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Licence FMMADA valide (12/2026)</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="pl-64 flex flex-col flex-1">
          <header className="sticky top-0 z-10 h-16 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between px-8">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Rechercher combat, adversaire..." 
                className="w-full bg-zinc-900/30 border border-zinc-800 py-2 pl-10 pr-3 text-xs outline-none focus:border-amber-500/30 text-white" 
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />Prêt au combat
              </span>
              <div className="h-6 w-px bg-zinc-800" />
              <button className="relative border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-400 hover:text-white transition">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-amber-500 rounded-full" />
              </button>
              <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700" />
            </div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div 
                key={active} 
                initial={{ opacity: 0, y: 6 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -6 }} 
                transition={{ duration: 0.18 }}
              >
                {active === "overview" && <OverviewModule />}
                {active === "profil" && <ProfilModule />}
                {active === "palmares" && <PalmaresModule />}
                {active === "combats" && <CombatsModule />}
                {active === "invitations" && <InvitationsModule />}
                {active === "entrainements" && <EntrainementsModule />}
                {active === "medical" && <MedicalModule />}
                {active === "poids" && <PoidsModule />}
                {active === "finances" && <FinancesModule />}
                {active === "documents" && <DocumentsModule />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <BrandPopup popup={popup} setPopup={setPopup} />
    </PopupContext.Provider>
  )
}