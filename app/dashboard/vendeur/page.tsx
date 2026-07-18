"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingCart, Boxes, MapPinned, Wallet, Users, Tag, Truck, FileText,
  Search, Bell, Plus, X, Calendar, MapPin, Eye, Trash2, Upload,
  ArrowUpRight, AlertTriangle, CheckCircle2, Activity, Shield
} from "lucide-react"

type VendorModule = "overview" | "catalogue" | "commandes" | "stock" | "ventes" | "finances" | "clients" | "promos" | "livraison" | "documents"
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
  showSecondInput?: boolean; 
  inputPlaceholder?: string; 
  secondInputPlaceholder?: string; 
  inputValue?: string; 
  secondInputValue?: string 
}

const PopupContext = createContext<any>(null)

function BrandPopup({ popup, setPopup }: { popup: PopupState; setPopup: any }) {
  const [input, setInput] = useState("")
  const [input2, setInput2] = useState("")

  useEffect(() => { 
    if (popup.open) { 
      setInput(popup.inputValue || "") 
      setInput2(popup.secondInputValue || "") 
    } 
  }, [popup.open, popup.inputValue, popup.secondInputValue])

  if (!popup.open) return null

  const close = () => setPopup((p: any) => ({ ...p, open: false }))
  const ok = () => { 
    if (popup.showInput && popup.showSecondInput) { 
      if (!input.trim() || !input2.trim()) return
      popup.onConfirm?.(input.trim(), input2.trim()) 
    } else if (popup.showInput) { 
      if (!input.trim()) return
      popup.onConfirm?.(input.trim()) 
    } else {
      popup.onConfirm?.() 
    }
    close() 
  }
  const cancel = () => { 
    popup.onCancel?.() 
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
              <div className="h-5 w-5 bg-amber-500 text-black font-black text-[10px] flex items-center justify-center">IM</div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Indesy Mialy • Vendeur</span>
            </div>
            <button onClick={cancel} className="text-zinc-600 hover:text-zinc-300">
              <X className="h-3 w-3" />
            </button>
          </div>
          <h4 className="mt-3 text-[11.5px] font-bold uppercase text-white">{popup.title}</h4>
          <p className="mt-1 text-xs leading-[1.5] text-zinc-400 whitespace-pre-wrap">{popup.message}</p>
          
          {popup.showInput && (
            <div className="mt-3 space-y-1.5">
              <input 
                autoFocus 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && ok()} 
                placeholder={popup.inputPlaceholder} 
                className="h-8 w-full bg-zinc-900 border border-zinc-800 px-2.5 text-xs text-white outline-none focus:border-amber-500/50" 
              />
              {popup.showSecondInput && (
                <input 
                  value={input2} 
                  onChange={e => setInput2(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && ok()}
                  placeholder={popup.secondInputPlaceholder} 
                  className="h-8 w-full bg-zinc-900 border border-zinc-800 px-2.5 text-xs text-white outline-none focus:border-amber-500/50" 
                />
              )}
            </div>
          )}
          
          <div className="mt-3.5 flex justify-end gap-1.5">
            {(popup.type === "confirm" || popup.showInput) && (
              <button onClick={cancel} className="h-7 px-3 text-[10.5px] border border-zinc-800 text-zinc-400 hover:bg-zinc-900/50 transition">
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

// MODULES VENDEUR
function OverviewModule() {
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <p className="text-[10px] uppercase font-bold text-zinc-500">CA Aujourd'hui</p>
          <p className="mt-1 text-xl font-black text-white">1 240 000 Ar</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />+18% vs hier</p>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <p className="text-[10px] uppercase font-bold text-zinc-500">Commandes</p>
          <p className="mt-1 text-xl font-black text-white">27</p>
          <p className="text-xs text-amber-400">6 en attente préparation</p>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <p className="text-[10px] uppercase font-bold text-zinc-500">Stock critique</p>
          <p className="mt-1 text-xl font-black text-red-400">4</p>
          <p className="text-xs text-zinc-500">Produits à réapprovisionner</p>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <p className="text-[10px] uppercase font-bold text-zinc-500">Prochain Event</p>
          <p className="mt-1 text-sm font-bold text-white">MFN VI</p>
          <p className="text-xs text-zinc-500 flex items-center gap-1"><Calendar className="h-3 w-3" />15 Août • Mahajanga</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-5">
          <h3 className="text-sm font-bold text-white">Alertes Vendeur</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-3">
              <span className="text-xs text-amber-200">4 produits sous seuil (Gants 14oz, T-shirt L)</span>
              <button onClick={() => ctx?.showPopup({ title: "Stock", message: "Ouvre le module Stock pour réappro", type: "warning" })} className="text-xs font-bold text-amber-400 underline">Voir</button>
            </div>
            <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-3">
              <span className="text-xs text-zinc-400">Commission INDESY MIALY 12% prélevée sur 2 commandes</span>
              <span className="text-xs text-zinc-500">- 48 000 Ar</span>
            </div>
          </div>
        </div> {/* Correction : Fermeture de la div md:col-span-2 résolue ici */}
        
        <div className="border border-zinc-900 bg-zinc-950 p-5">
          <h3 className="text-sm font-bold text-white">Stand Event</h3>
          <p className="text-xs text-zinc-500 mt-1">Zone B12 • Accès élec. OK</p>
          <div className="mt-3 h-1.5 w-full bg-zinc-900">
            <div className="h-full bg-emerald-500" style={{ width: "92%" }} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">Setup validé à 92% par l'orga</p>
        </div>
      </div>
    </div>
  )
}

function CatalogueModule() {
  const ctx = useContext(PopupContext)
  const [products, setProducts] = useState([
    { id: "p1", name: "Gants MMA Pro 14oz", sku: "GLOV-14", price: "180 000 Ar", stock: 12, cat: "Équipement" }, 
    { id: "p2", name: "T-Shirt MFN V - Noir", sku: "TSH-MFN5-BK-L", price: "45 000 Ar", stock: 3, cat: "Merch" }, 
    { id: "p3", name: "Protège-dents custom", sku: "MOUTH-CUST", price: "25 000 Ar", stock: 24, cat: "Accessoire" }
  ])
  
  const add = () => ctx?.showDoublePrompt({ 
    title: "Nouveau produit", 
    message: "Nom + Prix (ex: 45000)", 
    firstPlaceholder: "Nom produit", 
    secondPlaceholder: "Prix en Ar", 
    onConfirm: (n: string, pr: string) => setProducts((p) => [
      { id: `p_${Date.now()}`, name: n, sku: `SKU-${Date.now()}`, price: `${pr} Ar`, stock: 10, cat: "Nouveau" },
      ...p
    ]) 
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-white">Catalogue Produits • {products.length}</h3>
        <button onClick={add} className="h-8 px-3 bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5 hover:bg-amber-600 transition">
          <Plus className="h-3.5 w-3.5" />Ajouter produit
        </button>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-900/30 border-b border-zinc-900 text-xs uppercase font-bold text-zinc-500">
              <th className="p-3">Produit</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Prix</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-xs">
            {products.map((pr) => (
              <tr key={pr.id} className="hover:bg-zinc-900/20">
                <td className="p-3 font-bold text-white flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-zinc-600" />{pr.name}
                </td>
                <td className="p-3 font-mono text-zinc-500">{pr.sku}</td>
                <td className="p-3 text-zinc-300">{pr.price}</td>
                <td className="p-3">
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold ${pr.stock <= 5 ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"}`}>
                    {pr.stock}
                  </span>
                </td>
                <td className="p-3 flex gap-1">
                  <button onClick={() => ctx?.showPopup({ title: pr.name, message: `Catégorie: ${pr.cat}\nStock: ${pr.stock}`, type: "info" })} className="h-6 w-6 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition">
                    <Eye className="h-3 w-3" />
                  </button>
                  <button onClick={() => setProducts((p) => p.filter((x) => x.id !== pr.id))} className="h-6 w-6 border border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-red-400 transition">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CommandesModule() {
  const ctx = useContext(PopupContext)
  const [orders] = useState([
    { id: "#1024", client: "Andry R.", total: "125 000 Ar", status: "En attente", date: "12/07" }, 
    { id: "#1023", client: "Sitraka M.", total: "45 000 Ar", status: "Préparée", date: "12/07" }, 
    { id: "#1022", client: "Guillaume B.", total: "360 000 Ar", status: "Livrée", date: "11/07" }
  ])

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <h3 className="text-sm font-bold text-white">Commandes récentes</h3>
        <span className="text-xs text-zinc-500">{orders.length} commandes</span>
      </div>
      {orders.map((o) => (
        <div key={o.id} className="flex justify-between items-center border border-zinc-900 bg-zinc-950 p-4">
          <div>
            <p className="text-sm font-bold text-white">{o.id} • {o.client}</p>
            <p className="text-xs text-zinc-500">{o.date} • {o.total}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${o.status === "Livrée" ? "bg-emerald-500/10 text-emerald-400" : o.status === "Préparée" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>
              {o.status}
            </span>
            <button onClick={() => ctx?.showConfirm({ title: "Changer statut?", message: `Passer ${o.id} en Livrée?`, confirmText: "Valider", onConfirm: () => ctx?.showPopup({ title: "OK", message: "Commande mise à jour", type: "success" }) })} className="h-7 px-2.5 border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-900 transition">
              Traiter
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function StockModule() { 
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm font-bold text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />Rupture imminente
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-zinc-400">
          <li>• T-Shirt L - Noir (3 restants)</li>
          <li>• Gants 14oz - Rouge (2 restants)</li>
        </ul>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-4">
        <p className="text-sm font-bold text-white">Inventaire global</p>
        <p className="mt-2 text-2xl font-black text-white">187</p>
        <p className="text-xs text-zinc-500">unités en stock • 12 SKU actifs</p>
      </div>
    </div>
  ) 
}

function VentesEventModule() { 
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-3">
      <div className="border border-zinc-900 bg-zinc-950 p-5 flex justify-between items-center">
        <div>
          <p className="text-sm font-bold text-white">Mahajanga Fight Night VI</p>
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <MapPinned className="h-3 w-3" />Zone B12 • 15 Août • Stand validé
          </p>
        </div>
        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">Confirmé</span>
      </div>
      <button onClick={() => ctx?.showPopup({ title: "Ventes sur place", message: "Mode caisse offline activé pour l'event", type: "success" })} className="w-full h-10 bg-amber-500 text-black text-xs font-black uppercase hover:bg-amber-600 transition">
        Ouvrir caisse évènement
      </button>
    </div>
  ) 
}

function FinancesModule() { 
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <div className="border border-zinc-900 bg-zinc-950 p-4">
        <p className="text-[10px] uppercase text-zinc-500">CA brut (30j)</p>
        <p className="text-xl font-black text-white mt-1">8 420 000 Ar</p>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-4">
        <p className="text-[10px] uppercase text-zinc-500">Commissions INDESY (12%)</p>
        <p className="text-xl font-black text-amber-400 mt-1">- 1 010 400 Ar</p>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-4">
        <p className="text-[10px] uppercase text-zinc-500">Net à percevoir</p>
        <p className="text-xl font-black text-emerald-400 mt-1">7 409 600 Ar</p>
        <p className="text-xs text-zinc-500 mt-1">Payout le 20/07 via Mobile Money</p>
      </div>
    </div>
  ) 
}

function ClientsModule() { 
  return (
    <div className="border border-zinc-900 bg-zinc-950 overflow-hidden">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-zinc-900/30 border-b border-zinc-900 text-xs uppercase font-bold text-zinc-500">
            <th className="p-3">Client</th>
            <th className="p-3">Commandes</th>
            <th className="p-3">Total dépensé</th>
            <th className="p-3">Fidélité</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900">
          {[{ n: "Andry R.", c: 4, t: "520 000 Ar", f: "Gold" }, { n: "Sitraka M.", c: 2, t: "90 000 Ar", f: "Silver" }].map((cl) => (
            <tr key={cl.n} className="hover:bg-zinc-900/10 transition-colors">
              <td className="p-3 font-bold text-white">{cl.n}</td>
              <td className="p-3 text-zinc-400">{cl.c}</td>
              <td className="p-3 text-zinc-300">{cl.t}</td>
              <td className="p-3">
                <span className="px-1.5 py-0.5 bg-zinc-800 text-[10px] text-zinc-300">{cl.f}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) 
}

function PromosModule() { 
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-white">Codes promo actifs</h3>
        <button onClick={() => ctx?.showDoublePrompt({ title: "Nouveau code", message: "Code + Remise %", firstPlaceholder: "Ex: MFN10", secondPlaceholder: "Ex: 10", onConfirm: (c: string, r: string) => ctx?.showPopup({ title: "Créé", message: `${c} - ${r}% créé`, type: "success" }) })} className="h-7 px-3 bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition">
          Créer code
        </button>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-4 flex justify-between">
        <div>
          <p className="text-sm font-bold text-white">MFN10</p>
          <p className="text-xs text-zinc-500">-10% sur tout le merch • 34 utilisations</p>
        </div>
        <span className="text-xs font-bold text-emerald-400">ACTIF</span>
      </div>
    </div>
  ) 
}

function LivraisonModule() { 
  return (
    <div className="border border-zinc-900 bg-zinc-950 p-5">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Truck className="h-4 w-4 text-amber-500" />Expéditions en cours
      </h3>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-3">
          <span className="text-xs text-zinc-300">#1023 • Colis en transit vers Nosy Be</span>
          <span className="text-xs text-amber-400">En cours</span>
        </div>
        <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-3">
          <span className="text-xs text-zinc-300">#1022 • Livré le 11/07</span>
          <span className="text-xs text-emerald-400">Livré</span>
        </div>
      </div>
    </div>
  ) 
}

function DocsModule() { 
  return (
    <div className="space-y-2">
      {[{ n: "KYC Vendeur - Validé", s: "Validé", i: CheckCircle2 }, { n: "Facture Commission Juin", s: "À payer", i: FileText }].map((d) => (
        <div key={d.n} className="flex justify-between items-center border border-zinc-900 bg-zinc-950 p-4">
          <div className="flex items-center gap-3">
            <d.i className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-sm font-bold text-white">{d.n}</p>
              <p className="text-xs uppercase font-bold text-zinc-500">{d.s}</p>
            </div>
          </div>
          <button className="h-7 px-3 border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-900 transition">Voir</button>
        </div>
      ))}
    </div>
  ) 
}

export default function VendeurDashboard() {
  const [active, setActive] = useState<VendorModule>("overview")
  const [search, setSearch] = useState("")
  const [popup, setPopup] = useState<PopupState>({ open: false, title: "", message: "", type: "info" })
  
  const showPopup = (o: any) => setPopup({ open: true, title: o.title || "Info", message: o.message, type: o.type || "info", confirmText: "Fermer" })
  const showConfirm = (o: any) => setPopup({ open: true, title: o.title || "Confirmation", message: o.message, type: o.type || "confirm", confirmText: o.confirmText || "Confirmer", cancelText: o.cancelText || "Annuler", onConfirm: o.onConfirm, onCancel: o.onCancel })
  const showDoublePrompt = (o: any) => setPopup({ open: true, title: o.title, message: o.message, type: "prompt", confirmText: "Créer", cancelText: "Annuler", showInput: true, showSecondInput: true, inputPlaceholder: o.firstPlaceholder, secondInputPlaceholder: o.secondPlaceholder, onConfirm: o.onConfirm })

  const menu = [
    { id: "overview" as VendorModule, label: "Vue d'ensemble", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "catalogue" as VendorModule, label: "Catalogue Produits", icon: <Package className="h-5 w-5" />, badge: "12" },
    { id: "commandes" as VendorModule, label: "Commandes", icon: <ShoppingCart className="h-5 w-5" />, badge: "6" },
    { id: "stock" as VendorModule, label: "Stock & Inventaire", icon: <Boxes className="h-5 w-5" /> },
    { id: "ventes" as VendorModule, label: "Ventes Évènement", icon: <MapPinned className="h-5 w-5" /> },
    { id: "finances" as VendorModule, label: "Finances & Payouts", icon: <Wallet className="h-5 w-5" /> },
    { id: "clients" as VendorModule, label: "Clients & CRM", icon: <Users className="h-5 w-5" /> },
    { id: "promos" as VendorModule, label: "Promos & Codes", icon: <Tag className="h-5 w-5" /> },
    { id: "livraison" as VendorModule, label: "Livraison", icon: <Truck className="h-5 w-5" /> },
    { id: "documents" as VendorModule, label: "Factures & KYC", icon: <FileText className="h-5 w-5" /> },
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
                <h1 className="text-sm font-black uppercase">INDESY MIALY</h1>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block">Espace Vendeur</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-3 border border-zinc-900 bg-zinc-900/30 p-3 rounded-sm">
              <div className="h-10 w-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black rounded-full text-white">MV</div>
              <div>
                <p className="text-xs font-bold">Mahajanga Fight Shop</p>
                <p className="text-[10px] text-zinc-500">Vendeur vérifié • Note 4.8/5</p>
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
                    <span className={`h-4 min-w-4 px-1 text-[10px] font-black flex items-center justify-center rounded-full transition-colors ${
                      active === it.id ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-300"
                    }`}>
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
              <span>Paiements sécurisés via INDESY MIALY • Payout J+2</span>
            </div>
          </div>
        </aside>

        {/* Content wrap */}
        <div className="pl-64 flex flex-col flex-1">
          <header className="sticky top-0 z-10 h-16 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between px-8">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Rechercher produit, commande, client..." 
                className="w-full bg-zinc-900/30 border border-zinc-800 py-2 pl-10 pr-3 text-xs outline-none focus:border-amber-500/30 text-white" 
              />
            </div>
            
            <div className="flex items-center gap-3">
              <span className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />Boutique ouverte
              </span>
              <div className="h-6 w-px bg-zinc-800" />
              <button className="relative border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-400 hover:text-white transition rounded-sm">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-amber-500 rounded-full" />
              </button>
              <button 
                onClick={() => showPopup({ title: "Nouveau produit", message: "Utilisez le bouton 'Ajouter produit' dans l'onglet 'Catalogue Produits' pour renseigner les informations.", type: "info" })} 
                className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-600 transition"
              >
                <Plus className="h-4 w-4" />Nouveau Produit
              </button>
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
                {active === "catalogue" && <CatalogueModule />}
                {active === "commandes" && <CommandesModule />}
                {active === "stock" && <StockModule />}
                {active === "ventes" && <VentesEventModule />}
                {active === "finances" && <FinancesModule />}
                {active === "clients" && <ClientsModule />}
                {active === "promos" && <PromosModule />}
                {active === "livraison" && <LivraisonModule />}
                {active === "documents" && <DocsModule />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <BrandPopup popup={popup} setPopup={setPopup} />
    </PopupContext.Provider>
  )
}

