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
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={cancel} />
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden rounded-none">
        <div className="h-1 w-full bg-blue-600" />
        <div className="p-4">
          <div className="flex justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 bg-blue-600 text-white font-black text-xs flex items-center justify-center rounded-none">IM</div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Indesy Mialy</span>
            </div>
            <button onClick={cancel} className="text-neutral-500 hover:text-neutral-300">
              <X className="h-3 w-3" />
            </button>
          </div>
          <h4 className="mt-3 text-xs font-bold uppercase text-white tracking-wider">{popup.title}</h4>
          <p className="mt-1 text-xs leading-[1.5] text-neutral-400 whitespace-pre-wrap">{popup.message}</p>
          
          {popup.showInput && (
            <input 
              autoFocus 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder={popup.inputPlaceholder} 
              className="mt-3 h-9 w-full bg-black border border-neutral-800 px-2.5 text-xs text-white outline-none focus:border-blue-500" 
            />
          )}
          
          <div className="mt-4 flex justify-end gap-1.5">
            {(popup.type === "confirm" || popup.showInput) && (
              <button onClick={cancel} className="h-8 px-4 text-xs font-bold uppercase tracking-wider border border-neutral-800 text-neutral-400 hover:bg-neutral-950 rounded-none transition">
                {popup.cancelText || "Annuler"}
              </button>
            )}
            <button onClick={ok} className="h-8 px-4 text-xs font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-500 rounded-none transition">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-neutral-800 bg-neutral-900 p-5 rounded-none shadow-xl"><p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Record Pro</p><p className="mt-2 text-xl font-black text-white">8 - 2 - 0</p><p className="mt-2 text-xs text-emerald-400 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />3 victoires consécutives</p></div>
        <div className="border border-neutral-800 bg-neutral-900 p-5 rounded-none shadow-xl"><p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Prochain Combat</p><p className="mt-2 text-sm font-black text-white uppercase">vs Razafy 'King'</p><p className="text-xs text-neutral-500 mt-0.5">15 Août • Gymnase Mahajanga</p></div>
        <div className="border border-neutral-800 bg-neutral-900 p-5 rounded-none shadow-xl"><p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Poids Actuel</p><p className="mt-2 text-xl font-black text-amber-500">83.4 kg</p><p className="text-xs text-neutral-400 mt-0.5">Cible 77 kg (-6.4 kg)</p></div>
        <div className="border border-neutral-800 bg-neutral-900 p-5 rounded-none shadow-xl"><p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Licence</p><p className="mt-2 text-sm font-bold text-emerald-400 uppercase">Valide</p><p className="text-xs text-neutral-500 mt-0.5">Expire 12/2026</p></div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 border border-neutral-800 bg-neutral-900 p-5 rounded-none shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-neutral-800 pb-3 flex items-center gap-2"><Flame className="h-4 w-4 text-amber-500" />Alerte Action Requise</h3>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-3 rounded-none">
              <span className="text-xs text-amber-200">Certificat médical à renouveler dans 8 jours</span>
              <button onClick={() => ctx?.showPopup({ title: "Médical", message: "Upload ton nouveau certificat", type: "warning" })} className="text-xs font-bold text-amber-400 underline uppercase tracking-tight">Régulariser</button>
            </div>
            <div className="flex justify-between items-center bg-black/40 border border-neutral-800 p-3 rounded-none">
              <span className="text-xs text-neutral-400">Invitation combat - Mahajanga Fight Night VI</span>
              <button onClick={() => ctx?.showConfirm({ title: "Accepter le combat?", message: "Poids -77kg vs Andry T. le 15/08", confirmText: "Accepter", onConfirm: () => ctx?.showPopup({ title: "Accepté", message: "Contrat envoyé au promoteur", type: "success" }) })} className="h-7 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-none transition-colors">Voir</button>
            </div>
          </div>
        </div>
        <div className="border border-neutral-800 bg-neutral-900 p-5 rounded-none shadow-xl"><h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-neutral-800 pb-3">Camp en cours</h3><p className="text-xs text-neutral-400 mt-3 font-bold uppercase">Tiger Combat Academy • 6 sem.</p><div className="mt-3 h-1.5 w-full bg-black border border-neutral-800/40 rounded-none overflow-hidden"><div className="h-full bg-blue-600" style={{ width: "68%" }} /></div><p className="mt-2 text-xs text-neutral-500">68% complété • 12 séances restantes</p></div>
      </div>
    </div>
  )
}

function ProfilModule() { 
  type ProfilSubTab = "coordonnees" | "sportif" | "documents";
  const [subTab, setSubTab] = useState<ProfilSubTab>("coordonnees")
  
  const [editCoord, setEditCoord] = useState(false)
  const [editSport, setEditSport] = useState(false)

  const initialCoord = {
    phone: "034 12 345 67",
    email: "rakoto@indesymialy.mg",
    address: "Ambodivona, Antananarivo",
    emergency: "033 98 765 43"
  }

  const initialSport = {
    stance: "Orthodoxe",
    reach: "182",
    height: "178",
    category: "Welter -77kg",
    team: "Alpha MMA Mahajanga"
  }

  const [coordData, setCoordData] = useState(initialCoord)
  const [tempCoord, setTempCoord] = useState(initialCoord)

  const [sportData, setSportData] = useState(initialSport)
  const [tempSport, setTempSport] = useState(initialSport)

  const startEditCoord = () => {
    setTempCoord({...coordData})
    setEditCoord(true)
  }
  const cancelEditCoord = () => {
    setCoordData({...tempCoord})
    setEditCoord(false)
  }

  const startEditSport = () => {
    setTempSport({...sportData})
    setEditSport(true)
  }
  const cancelEditSport = () => {
    setSportData({...tempSport})
    setEditSport(false)
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex border-b border-neutral-800 bg-neutral-900 p-1 gap-1 rounded-none shadow-xl">
        <button 
          onClick={() => setSubTab("coordonnees")} 
          className={`h-9 px-5 text-xs font-black uppercase tracking-wider rounded-none transition-all ${subTab === "coordonnees" ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white hover:bg-black/20"}`}
        >
          Coordonnées
        </button>
        <button 
          onClick={() => setSubTab("sportif")} 
          className={`h-9 px-5 text-xs font-black uppercase tracking-wider rounded-none transition-all ${subTab === "sportif" ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white hover:bg-black/20"}`}
        >
          Renseignements sportifs
        </button>
        <button 
          onClick={() => setSubTab("documents")} 
          className={`h-9 px-5 text-xs font-black uppercase tracking-wider rounded-none transition-all ${subTab === "documents" ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white hover:bg-black/20"}`}
        >
          Documents & Identité
        </button>
      </div>

      <div className="border border-neutral-800 bg-neutral-900 p-6 rounded-none shadow-xl min-h-[380px] flex flex-col justify-between">
        <div className="w-full">
          {subTab === "coordonnees" && (
            <>
              <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-neutral-800 pb-3 mb-4">Coordonnées Utilisateur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Téléphone</div>
                  {!editCoord ? <div className="mt-1.5 font-bold text-white bg-black/30 p-2 border border-neutral-800/40">{coordData.phone}</div> : <input type="text" value={coordData.phone} onChange={e => setCoordData({...coordData, phone: e.target.value})} className="mt-1.5 h-9 w-full bg-black border border-neutral-800 px-2 text-white text-xs outline-none focus:border-blue-500" />}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Email</div>
                  {!editCoord ? <div className="mt-1.5 font-bold text-white bg-black/30 p-2 border border-neutral-800/40">{coordData.email}</div> : <input type="text" value={coordData.email} onChange={e => setCoordData({...coordData, email: e.target.value})} className="mt-1.5 h-9 w-full bg-black border border-neutral-800 px-2 text-white text-xs outline-none focus:border-blue-500" />}
                </div>
                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Adresse</div>
                  {!editCoord ? <div className="mt-1.5 text-neutral-300 bg-black/30 p-2 border border-neutral-800/40">{coordData.address}</div> : <input type="text" value={coordData.address} onChange={e => setCoordData({...coordData, address: e.target.value})} className="mt-1.5 h-9 w-full bg-black border border-neutral-800 px-2 text-white text-xs outline-none focus:border-blue-500" />}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Contact Urgence</div>
                  {!editCoord ? <div className="mt-1.5 font-bold text-red-500 bg-black/30 p-2 border border-neutral-800/40">{coordData.emergency}</div> : <input type="text" value={coordData.emergency} onChange={e => setCoordData({...coordData, emergency: e.target.value})} className="mt-1.5 h-9 w-full bg-black border border-neutral-800 px-2 text-white text-xs outline-none focus:border-blue-500" />}
                </div>
              </div>
            </>
          )}

          {subTab === "sportif" && (
            <>
              <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-neutral-800 pb-3 mb-4">Renseignements Sportifs</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Garde</p>
                  {!editSport ? <p className="text-white font-bold uppercase mt-1.5 bg-black/30 p-2 border border-neutral-800/40">{sportData.stance}</p> : <input type="text" value={sportData.stance} onChange={e => setSportData({...sportData, stance: e.target.value})} className="mt-1.5 h-9 w-full bg-black border border-neutral-800 px-2 text-white text-xs outline-none focus:border-blue-500" />}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Allonge (cm)</p>
                  {!editSport ? <p className="text-white font-bold mt-1.5 bg-black/30 p-2 border border-neutral-800/40">{sportData.reach} cm</p> : <input type="text" value={sportData.reach} onChange={e => setSportData({...sportData, reach: e.target.value})} className="mt-1.5 h-9 w-full bg-black border border-neutral-800 px-2 text-white text-xs outline-none focus:border-blue-500" />}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Taille (cm)</p>
                  {!editSport ? <p className="text-white font-bold mt-1.5 bg-black/30 p-2 border border-neutral-800/40">{sportData.height} cm</p> : <input type="text" value={sportData.height} onChange={e => setSportData({...sportData, height: e.target.value})} className="mt-1.5 h-9 w-full bg-black border border-neutral-800 px-2 text-white text-xs outline-none focus:border-blue-500" />}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Catégorie</p>
                  {!editSport ? <p className="text-amber-500 font-black uppercase mt-1.5 bg-black/30 p-2 border border-neutral-800/40">{sportData.category}</p> : <input type="text" value={sportData.category} onChange={e => setSportData({...sportData, category: e.target.value})} className="mt-1.5 h-9 w-full bg-black border border-neutral-800 px-2 text-white text-xs outline-none focus:border-blue-500" />}
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Équipe / Club</p>
                  {!editSport ? <p className="text-white font-bold uppercase mt-1.5 bg-black/30 p-2 border border-neutral-800/40">{sportData.team}</p> : <input type="text" value={sportData.team} onChange={e => setSportData({...sportData, team: e.target.value})} className="mt-1.5 h-9 w-full bg-black border border-neutral-800 px-2 text-white text-xs outline-none focus:border-blue-500" />}
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-neutral-800/60">
                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Disciplines de combat</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-0.5 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-400 uppercase rounded-none">MMA</span>
                  <span className="px-2.5 py-0.5 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-400 uppercase rounded-none">Lutte</span>
                  <span className="px-2.5 py-0.5 bg-blue-600/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase rounded-none">Jiu-Jitsu</span>
                </div>
              </div>
            </>
          )}

          {subTab === "documents" && (
            <>
              <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-neutral-800 pb-3 mb-4">Documents & Identité</h3>
              <div className="space-y-4 font-mono text-xs">
                <div><div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">CIN</div><div className="mt-1.5 font-bold text-white bg-black/30 p-2 border border-neutral-800/40">101 234 567 890</div></div>
                <div><div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Statut Médical</div><div className="mt-1.5 flex items-center gap-2 bg-black/30 p-2 border border-neutral-800/40"><span className="w-2 h-2 bg-emerald-500 block shrink-0" /> <span className="text-emerald-400 font-black uppercase text-[11px]">Apte - 12/2026</span></div></div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-neutral-800 flex justify-end gap-2">
          {subTab === "coordonnees" && (
            <>
              {!editCoord ? (
                <button onClick={startEditCoord} className="h-9 px-5 border border-neutral-800 bg-black/40 hover:bg-neutral-950 text-xs font-bold uppercase tracking-wider text-neutral-300 transition-colors rounded-none">Modifier</button>
              ) : (
                <>
                  <button onClick={cancelEditCoord} className="h-9 px-5 border border-neutral-800 bg-neutral-950 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors rounded-none">Annuler</button>
                  <button onClick={() => setEditCoord(false)} className="h-9 px-5 bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase tracking-wider text-white transition-colors rounded-none">Enregistrer</button>
                </>
              )}
            </>
          )}

          {subTab === "sportif" && (
            <>
              {!editSport ? (
                <button onClick={startEditSport} className="h-9 px-5 border border-neutral-800 bg-black/40 hover:bg-neutral-950 text-xs font-bold uppercase tracking-wider text-neutral-300 transition-colors rounded-none">Modifier</button>
              ) : (
                <>
                  <button onClick={cancelEditSport} className="h-9 px-5 border border-neutral-800 bg-neutral-950 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors rounded-none">Annuler</button>
                  <button onClick={() => setEditSport(false)} className="h-9 px-5 bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase tracking-wider text-white transition-colors rounded-none">Enregistrer</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  ) 
}

function PalmaresModule() { 
  return (
    <div className="border border-neutral-800 bg-neutral-900 overflow-hidden rounded-none shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="bg-black/60 border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
              <th className="p-4">Date</th>
              <th className="p-4">Adversaire</th>
              <th className="p-4">Résultat</th>
              <th className="p-4">Méthode</th>
              <th className="p-4">Event</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {[{ d: "12/04/2026", adv: "Sitraka R.", res: "Victoire", met: "TKO R2", ev: "MFN IV" }, 
              { d: "08/02/2026", adv: "Guillaume B.", res: "Victoire", met: "Décision", ev: "MFN III" }, 
              { d: "11/11/2025", adv: "Andry T.", res: "Défaite", met: "Soumission", ev: "Open Nosy Be" }
            ].map((r) => (
              <tr key={r.d} className="hover:bg-black/40 transition-colors">
                <td className="p-4 text-neutral-400">{r.d}</td>
                <td className="p-4 font-bold text-white uppercase">{r.adv}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-none ${
                    r.res === "Victoire" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}>{r.res}</span>
                </td>
                <td className="p-4 font-bold text-neutral-400 uppercase">{r.met}</td>
                <td className="p-4 text-neutral-500 font-bold uppercase">{r.ev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        <div key={c.name} className="flex justify-between items-center border border-neutral-800 bg-neutral-900 p-4 rounded-none shadow-xl">
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wider">{c.name}</p>
            <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-2"><Calendar className="h-3 w-3 text-neutral-500" />{c.date} • <MapPin className="h-3 w-3 text-neutral-500" />{c.loc}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-none ${c.status === "Confirmé" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{c.status}</span>
            <button onClick={() => ctx?.showPopup({ title: c.name, message: "Détails du fight camp et contrat", type: "info" })} className="h-7 w-7 border border-neutral-800 bg-black/40 flex items-center justify-center text-neutral-400 hover:text-white transition"><Eye className="h-3.5 w-3.5" /></button>
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
        <div key={i} className="border border-blue-500/20 bg-blue-500/5 p-4 flex justify-between items-center rounded-none shadow-xl">
          <div>
            <p className="text-xs font-black text-white uppercase tracking-wider">Défi reçu de Rova K. (-77kg)</p>
            <p className="text-[11px] text-neutral-400 mt-1 font-bold">Bourse proposée: <span className="text-amber-500">800 000 Ar</span> + prime KO</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => ctx?.showPopup({ title: "Refusé", message: "Invitation déclinée", type: "info" })} className="h-8 px-4 border border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:bg-neutral-950 rounded-none transition">Décliner</button>
            <button onClick={() => ctx?.showConfirm({ title: "Accepter le défi?", message: "Signature du contrat préliminaire", confirmText: "Accepter", onConfirm: () => ctx?.showPopup({ title: "Accepté", message: "Manager notifié", type: "success" }) })} className="h-8 px-4 bg-blue-600 text-white text-xs font-black uppercase tracking-wider hover:bg-blue-500 rounded-none transition">Accepter</button>
          </div>
        </div>
      ))}
    </div>
  ) 
}

function EntrainementsModule() { 
  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 rounded-none shadow-xl">
      <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-neutral-800 pb-3 flex items-center gap-2"><Dumbbell className="h-4 w-4 text-blue-500" />Planning Hebdo</h3>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
        {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d) => (
          <div key={d} className="border border-neutral-800 bg-black/40 p-3 rounded-none">
            <p className="font-black uppercase tracking-wider text-neutral-500 text-[10px]">{d}</p>
            <p className="mt-2 text-[11px] font-bold text-white uppercase">MMA • 18h</p>
            <p className="text-[10px] text-neutral-400 font-medium">Sparring</p>
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
      <div className="border border-neutral-800 bg-neutral-900 p-4 flex justify-between items-center rounded-none shadow-xl">
        <div>
          <p className="text-xs font-black text-white uppercase tracking-wider">Certificat médical aptitude combat</p>
          <p className="text-[11px] text-neutral-400 mt-1">Expire le 23/08/2026 • PDF validé</p>
        </div>
        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider rounded-none">Valide</span>
      </div>
      <button onClick={() => ctx?.showPopup({ title: "Upload", message: "Module upload médical", type: "info" })} className="w-full h-11 border border-dashed border-neutral-700 bg-neutral-900/40 text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-center gap-2 hover:bg-neutral-900 transition-colors rounded-none shadow-xl">
        <Upload className="h-4 w-4" />Téléverser nouveau document
      </button>
    </div>
  ) 
}

function PoidsModule() { 
  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 rounded-none shadow-xl">
      <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-neutral-800 pb-3 flex items-center gap-2"><Scale className="h-4 w-4 text-blue-500" />Suivi Weight Cut</h3>
      <div className="mt-4 flex items-end gap-1.5 h-24 border-b border-neutral-800/60 pb-1">
        {[82, 83, 82.5, 84, 83.4, 83, 82.8].map((v, i) => (
          <div key={i} className="flex-1 bg-neutral-800 transition-all hover:bg-neutral-700 relative rounded-none" style={{ height: `${(v - 75) * 8}px` }}>
            <div className="w-full bg-blue-600 absolute bottom-0 left-0" style={{ height: "40%" }} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-500">Objectif <span className="text-amber-500 font-bold">77kg</span> pour le 15 Août • Hydratation 62% • Suivi quotidien requis</p>
    </div>
  ) 
}

function FinancesModule() { 
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<"all" | "recette" | "depense">("all")
  
  // États locaux pour le nouveau formulaire
  const [newLabel, setNewLabel] = useState("")
  const [newCategory, setNewCategory] = useState("Bourse Combat")
  const [newAmount, setNewAmount] = useState("")
  const [newType, setNewType] = useState<"recette" | "depense">("recette")
  const [newDate, setNewDate] = useState("20/07/2026")

  const [txs, setTxs] = useState([
    { id: 1, transaction_date: "12/04/2026", label: "Bourse MFN IV", category: "Bourse Combat", amount: 5000000, transaction_type: "recette" },
    { id: 2, transaction_date: "15/04/2026", label: "Sponsor Urban Fit", category: "Sponsoring", amount: 1200000, transaction_type: "recette" },
    { id: 3, transaction_date: "20/04/2026", label: "Achat Équipements", category: "Matériel", amount: 450000, transaction_type: "depense" },
    { id: 4, transaction_date: "02/05/2026", label: "Frais Inscription Tournoi", category: "Inscription", amount: 150000, transaction_type: "depense" }
  ])

  const target = 10000000 
  const fmt = (v: number) => new Intl.NumberFormat("fr-FR").format(v)

  const recettes = txs.filter(t => t.transaction_type === "recette").reduce((acc, t) => acc + t.amount, 0)
  const depenses = txs.filter(t => t.transaction_type === "depense").reduce((acc, t) => acc + t.amount, 0)
  const marge = recettes - depenses
  const taux = Math.round((recettes / target) * 100) || 0

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim() || !newAmount) return

    const parsedAmount = parseFloat(newAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    const newTx = {
      id: Date.now(),
      transaction_date: newDate || "20/07/2026",
      label: newLabel.trim(),
      category: newCategory,
      amount: parsedAmount,
      transaction_type: newType
    }

    setTxs([newTx, ...txs])
    
    // Reset du formulaire & fermeture
    setNewLabel("")
    setNewAmount("")
    setShowAdd(false)
  }

  const filtered = txs.filter(t => {
    if (filter === "all") return true
    return t.transaction_type === filter
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div className="space-y-1">
          <h2 className="font-mono font-black tracking-widest text-white uppercase">FINANCES COMBATTANT</h2>
          <p className="font-mono text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Objectif {fmt(target)} Ar • <span className="text-amber-500">{taux}% atteint</span></p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setShowAdd(true)} className="flex-1 sm:flex-none h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-none transition-colors">+ Transaction</button>
          <button onClick={() => window.print()} className="flex-1 sm:flex-none h-10 px-5 border border-neutral-800 bg-black/40 hover:bg-neutral-900 text-neutral-300 font-mono text-xs uppercase tracking-wider rounded-none transition-colors">Export PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-none p-5 shadow-xl">
          <div className="font-mono text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Gains</div>
          <div className="font-mono font-black text-emerald-400 mt-2 text-base">+{fmt(recettes)} Ar</div>
          <div className="w-full h-1 bg-black mt-4 rounded-none overflow-hidden border border-neutral-800/40">
            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(taux, 100)}%` }} />
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-none p-5 shadow-xl">
          <div className="font-mono text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Cuts & Dépenses</div>
          <div className="font-mono font-black text-red-500 mt-2 text-base">-{fmt(depenses)} Ar</div>
          <div className="font-mono text-[10px] font-bold text-neutral-500 tracking-wider mt-4">{((depenses / recettes) * 100 || 0).toFixed(0)}% des gains totaux</div>
        </div>
        <div className={`bg-neutral-900 border rounded-none p-5 shadow-xl ${marge >= 0 ? 'border-neutral-800' : 'border-red-500/30'}`}>
          <div className="font-mono text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Net à empocher</div>
          <div className={`font-mono font-black mt-2 text-base ${marge >= 0 ? 'text-amber-500' : 'text-red-500'}`}>{fmt(marge)} Ar</div>
          <div className="font-mono text-[10px] text-neutral-500 tracking-wider font-bold uppercase mt-4">Saison 2026</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-none p-5 shadow-xl">
          <div className="font-mono text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Objectif vs Réalisé</div>
          <div className="font-mono font-black mt-2 text-base text-blue-400">{taux}%</div>
          <div className="font-mono text-[10px] text-neutral-500 mt-4 truncate">{fmt(recettes)} / {fmt(target)} Ar</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-none p-5 shadow-xl">
          <h3 className="font-mono font-black text-xs uppercase tracking-wider border-b border-neutral-800 pb-3 mb-4 text-white">Répartition</h3>
          <div className="space-y-4">
            {Object.entries(txs.reduce((acc: any, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})).map(([cat, amount]: any) => (
              <div key={cat} className="flex justify-between items-center font-mono text-xs">
                <span className="uppercase text-neutral-400 text-[11px] truncate pr-2">{cat}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20 h-1.5 bg-black border border-neutral-800/40 rounded-none overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.min((amount / recettes) * 100, 100)}%` }} />
                  </div>
                  <span className="w-24 text-right font-bold text-white text-[11px]">{fmt(Number(amount))} Ar</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-none overflow-hidden shadow-xl">
          <div className="p-4 flex justify-between items-center border-b border-neutral-800 bg-black/40">
            <div className="flex border border-neutral-800 bg-black p-0.5 rounded-none">
              {(["all", "recette", "depense"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`h-7 px-3 rounded-none font-mono text-[10px] uppercase transition-all ${
                    filter === f ? 'bg-amber-500 text-black font-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="font-mono text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{filtered.length} transactions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs text-left">
              <thead className="text-[10px] uppercase text-neutral-500 border-b border-neutral-800 bg-black/60">
                <tr>
                  <th className="p-4 font-bold tracking-wider">Date</th>
                  <th className="p-4 font-bold tracking-wider">Label</th>
                  <th className="p-4 font-bold tracking-wider">Catégorie</th>
                  <th className="p-4 font-bold tracking-wider text-right pr-6">Montant</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-neutral-800/60 hover:bg-black/40 transition-colors">
                    <td className="p-4 text-neutral-400">{t.transaction_date}</td>
                    <td className="p-4 font-bold text-white uppercase">{t.label}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-none ${
                        t.transaction_type === 'recette' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {t.category}
                      </span>
                    </td>
                    <td className={`p-4 text-right pr-6 font-black ${t.transaction_type === 'recette' ? 'text-emerald-400' : 'text-red-500'}`}>
                      {t.transaction_type === 'recette' ? '+' : ''}{fmt(t.amount)} Ar
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL AJOUT TRANSACTION */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm" 
              onClick={() => setShowAdd(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden rounded-none"
            >
              <div className="h-1 w-full bg-blue-600" />
              <form onSubmit={handleAddTransaction} className="p-5 font-mono">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">Nouvelle Transaction</h3>
                  <button type="button" onClick={() => setShowAdd(false)} className="text-neutral-500 hover:text-neutral-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block mb-1">Type</label>
                    <div className="grid grid-cols-2 gap-2 border border-neutral-800 p-0.5 bg-black">
                      <button 
                        type="button"
                        onClick={() => setNewType("recette")}
                        className={`h-8 text-xs font-black uppercase tracking-wider rounded-none transition-all ${newType === "recette" ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white"}`}
                      >
                        Recette
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewType("depense")}
                        className={`h-8 text-xs font-black uppercase tracking-wider rounded-none transition-all ${newType === "depense" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"}`}
                      >
                        Dépense
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block mb-1">Date</label>
                      <input 
                        type="text" 
                        value={newDate} 
                        onChange={e => setNewDate(e.target.value)}
                        placeholder="JJ/MM/AAAA"
                        className="h-9 w-full bg-black border border-neutral-800 px-2.5 text-xs text-white outline-none focus:border-blue-500 rounded-none" 
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block mb-1">Catégorie</label>
                      <select 
                        value={newCategory} 
                        onChange={e => setNewCategory(e.target.value)}
                        className="h-9 w-full bg-black border border-neutral-800 px-2 text-xs text-white outline-none focus:border-blue-500 rounded-none"
                      >
                        {newType === "recette" ? (
                          <>
                            <option value="Bourse Combat">Bourse Combat</option>
                            <option value="Sponsoring">Sponsoring</option>
                            <option value="Prime / Bonus">Prime / Bonus</option>
                          </>
                        ) : (
                          <>
                            <option value="Matériel">Matériel</option>
                            <option value="Inscription">Inscription</option>
                            <option value="Fight Camp">Fight Camp</option>
                            <option value="Santé / Soins">Santé / Soins</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block mb-1">Libellé / Label</label>
                    <input 
                      type="text" 
                      value={newLabel} 
                      onChange={e => setNewLabel(e.target.value)}
                      placeholder="Ex: Sponsor Fight Store, Gants Pro..."
                      className="h-9 w-full bg-black border border-neutral-800 px-2.5 text-xs text-white outline-none focus:border-blue-500 rounded-none" 
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block mb-1">Montant (Ar)</label>
                    <input 
                      type="number" 
                      value={newAmount} 
                      onChange={e => setNewAmount(e.target.value)}
                      placeholder="Ex: 500000"
                      className="h-9 w-full bg-black border border-neutral-800 px-2.5 text-xs text-white outline-none focus:border-blue-500 rounded-none" 
                      required
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 border-t border-neutral-800 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAdd(false)} 
                    className="h-8 px-4 text-xs font-bold uppercase tracking-wider border border-neutral-800 text-neutral-400 hover:bg-neutral-950 rounded-none transition"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="h-8 px-4 text-xs font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-500 rounded-none transition"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function DocumentsModule() { 
  const ctx = useContext(PopupContext); 
  return (
    <div className="space-y-2">
      {[{ name: "Contrat MFN VI.pdf", status: "À signer" }, { name: "Licence FMMADA 2026.pdf", status: "Signé" }].map((d) => (
        <div key={d.name} className="flex justify-between items-center border border-neutral-800 bg-neutral-900 p-4 rounded-none shadow-xl">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-neutral-500" />
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">{d.name}</p>
              <p className={`text-[10px] uppercase font-bold mt-0.5 ${d.status === "À signer" ? "text-amber-400" : "text-emerald-400"}`}>{d.status}</p>
            </div>
          </div>
          <button onClick={() => ctx?.showPopup({ title: d.name, message: d.status === "À signer" ? "Signature électronique" : "Téléchargement", type: "info" })} className="h-8 px-4 border border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:bg-neutral-950 rounded-none transition">{d.status === "À signer" ? "Signer" : "Voir"}</button>
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
    { id: "overview" as FighterModule, label: "Vue d'ensemble", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
    { id: "profil" as FighterModule, label: "Mon Profil", icon: <User className="h-3.5 w-3.5" /> },
    { id: "palmares" as FighterModule, label: "Palmarès & Stats", icon: <Trophy className="h-3.5 w-3.5" /> },
    { id: "combats" as FighterModule, label: "Mes Combats", icon: <Swords className="h-3.5 w-3.5" /> },
    { id: "invitations" as FighterModule, label: "Invitations / Défis", icon: <Mail className="h-3.5 w-3.5" />, badge: "2" },
    { id: "entrainements" as FighterModule, label: "Entraînements", icon: <Dumbbell className="h-3.5 w-3.5" /> },
    { id: "medical" as FighterModule, label: "Santé", icon: <HeartPulse className="h-3.5 w-3.5" /> },
    { id: "poids" as FighterModule, label: "Suivi Poids", icon: <Scale className="h-3.5 w-3.5" /> },
    { id: "finances" as FighterModule, label: "Finances", icon: <Wallet className="h-3.5 w-3.5" /> },
    { id: "documents" as FighterModule, label: "Contrats & Docs", icon: <FileText className="h-3.5 w-3.5" /> },
  ]

  return (
    <PopupContext.Provider value={{ showPopup, showConfirm, showDoublePrompt, showPrompt: showDoublePrompt }}>
      <div className="flex min-h-screen bg-neutral-950 text-neutral-100 font-mono antialiased selection:bg-red-600 selection:text-white">
        
        {/* Sidebar */}
        <aside className="fixed bottom-0 left-0 top-[var(--platform-header-height)] z-20 w-64 overflow-hidden border-r border-neutral-800 bg-neutral-900 flex flex-col justify-between p-4 rounded-none">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mt-4 flex items-center gap-3 border border-neutral-800 bg-black/40 p-3 rounded-none">
              <div className="h-9 w-9 bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-white rounded-none">RT</div>
              <div>
                <p className="text-xs font-bold text-white uppercase">Rakoto T.</p>
                <p className="text-[10px] text-neutral-500 font-medium">Espace : Combattant</p>
              </div>
            </div>
            <nav className="mt-6 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
              {menu.map((it) => (
                <button 
                  key={it.id} 
                  onClick={() => setActive(it.id)} 
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-l-2 transition-all rounded-none ${
                    active === it.id
                      ? "bg-blue-600/10 text-blue-400 border-blue-500 font-black" 
                      : "text-neutral-400 border-transparent hover:bg-black/30 hover:text-neutral-200"
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap text-xs font-semibold tracking-wide">{it.icon}{it.label}</span>
                  {it.badge && (
                    <span className="h-3.5 min-w-3.5 px-1 bg-amber-500 text-black text-[8px] font-black flex items-center justify-center rounded-none">
                      {it.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="border border-neutral-800 bg-black/40 p-3 rounded-none">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400 tracking-tight">
              <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Licence FMMADA (12/2026)</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="pl-64 flex flex-col flex-1">
          <header className="sticky top-0 z-10 h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between px-8">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Rechercher combat, adversaire..." 
                className="w-full bg-black/50 border border-neutral-800 py-2 pl-10 pr-3 text-xs outline-none focus:border-blue-500 text-white rounded-none" 
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />Prêt au combat
              </span>
              <div className="h-6 w-px bg-neutral-800" />
              <button className="relative border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:text-white transition rounded-none">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-blue-500 rounded-none" />
              </button>
              <div className="h-8 w-8 rounded-none bg-neutral-800 border border-neutral-700" />
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
