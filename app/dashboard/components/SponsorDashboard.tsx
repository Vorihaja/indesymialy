"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MessageWorkspace from '../messages/MessageWorkspace';
import ErpAuthGuard from '../ErpAuthGuard';

type NavType = 'dashboard' | 'contrats' | 'budget' | 'facturation' | 'actifs' | 'juridique' | 'equipe' | 'rapports';
type FilterType = 'all' | 'actif' | 'renouveler' | 'en-cours' | 'expire';

interface Contract {
  id?: string;
  ref: string;
  beneficiary: string;
  type: string;
  amount: number;
  start_date: string;
  end_date: string;
  manager: string;
  details: string;
  status: string;
  payment: string;
  created_at?: string;
}

export default function ErpSponsoringNoirEtOr() {
  const [currentNav, setCurrentNav] = useState<NavType>('contrats');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const [contracts, setContracts] = useState<Contract[]>([]);

  const [formData, setFormData] = useState({
    beneficiary: '',
    type: 'Combattant Pro',
    amount: '',
    startDate: '',
    endDate: '',
    manager: 'M. Razafy',
    status: 'En cours',
    payment: 'Acompte requis',
    details: ''
  });

  const triggerNotification = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  };

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      triggerNotification("❌ Erreur de chargement des données");
    } else {
      setContracts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContracts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- FONCTIONS DE FORMATAGE ET NETTOYAGE ---
  const formatCurrency = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Ar";
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const cleanNumberString = (val: string) => val.replace(/\D/g, "");

  const formatInputWithSpaces = (val: string) => {
    const digits = cleanNumberString(val);
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };
  // -------------------------------------------

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.beneficiary || !formData.amount || !formData.startDate || !formData.endDate) {
      triggerNotification("⚠️ Veuillez remplir tous les champs obligatoires");
      return;
    }

    const randomRef = `CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Nettoyage des espaces du séparateur de milliers avant envoi SQL
    const cleanAmount = parseFloat(formData.amount.replace(/\s/g, "")) || 0;

    const newContractData = {
      ref: randomRef,
      beneficiary: formData.beneficiary,
      type: formData.type,
      amount: cleanAmount,
      start_date: formData.startDate,
      end_date: formData.endDate,
      manager: formData.manager,
      status: formData.status,
      payment: formData.payment,
      details: formData.details || "Aucune clause additionnelle spécifiée."
    };

    const { data, error } = await supabase
      .from('contracts')
      .insert([newContractData])
      .select();

    if (error) {
      // Force l'affichage complet de toutes les propriétés masquées de l'erreur
      console.error("Détails complets de l'erreur SQL :", JSON.stringify(error, null, 2));
      console.dir(error); 
      
      triggerNotification(`❌ Erreur SQL : ${error.message || "Erreur de contrainte ou RLS"}`);
    } else {
      setContracts([data[0], ...contracts]);
      setIsModalOpen(false);
      triggerNotification(`📜 Contrat ${randomRef} créé avec succès !`);
      
      setFormData({
        beneficiary: '',
        type: 'Combattant Pro',
        amount: '',
        startDate: '',
        endDate: '',
        manager: 'M. Razafy',
        status: 'En cours',
        payment: 'Acompte requis',
        details: ''
      });
    }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) || c.ref.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (currentFilter === 'all') return true;
    
    const formattedStatus = c.status.toLowerCase().replace(" ", "-");
    const formattedFilter = currentFilter.toLowerCase();
    
    if (formattedFilter === 'actif' && formattedStatus === 'actif') return true;
    if (formattedFilter === 'renouveler' && formattedStatus === 'à-renouveler') return true;
    if (formattedFilter === 'en-cours' && formattedStatus === 'en-cours') return true;
    if (formattedFilter === 'expire' && formattedStatus === 'expiré') return true;
    return false;
  });

  return (
    <ErpAuthGuard>
      <div className="flex h-screen w-full bg-[#09090B] text-zinc-100 antialiased font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`fixed lg:static z-40 inset-y-0 left-0 w-[280px] bg-[#0E0E10] border-r border-[#1F1F23] transition-transform duration-300 flex flex-col
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        
        <div className="h-[68px] flex items-center gap-3 px-5 border-b border-[#1F1F23]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E6C667] via-[#C5A041] to-[#927122] flex items-center justify-center font-black text-black shadow-md shadow-[#C5A041]/10">I</div>
          <div>
            <div className="text-[14px] font-bold tracking-tight text-white uppercase">INDESY MIALY</div>
            <div className="text-[10px] text-[#C5A041] uppercase tracking-wider font-semibold -mt-0.5">Sponsoring Dashboard</div>
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-3 pb-2">Back-office</div>
          {[
            { id: 'dashboard', label: 'Dashboard Executive', icon: '📊' },
            { id: 'contrats', label: 'Gestion Contrats', icon: '📜', badge: contracts.length.toString() },
            { id: 'budget', label: 'Budget Sponsoring', icon: '💰' },
            { id: 'facturation', label: 'Facturation & Caution', icon: '🧾', dot: true },
            { id: 'actifs', label: 'Inventaire des Actifs', icon: '🖼️' },
            { id: 'juridique', label: 'Juridique & Clauses', icon: '⚖️' },
            { id: 'equipe', label: 'Équipe & Permissions', icon: '👥' },
            { id: 'rapports', label: 'Rapports & Exports', icon: '📈' },
          ].map((item) => {
            const isActive = currentNav === item.id;
            return (
              <button key={item.id} onClick={() => { setCurrentNav(item.id as NavType); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-medium transition-all duration-200 group relative ${isActive ? 'bg-gradient-to-r from-[#C5A041]/15 to-transparent text-white ring-1 ring-inset ring-[#C5A041]/30' : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[2.5px] bg-[#C5A041] rounded-r-full" />}
                <span className="text-[15px] opacity-80 group-hover:opacity-100">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {item.badge && <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-[#C5A041] text-black' : 'bg-zinc-800 text-zinc-400'}`}>{item.badge}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ZONE PRINCIPALE */}
      <div className="flex-1 min-w-0 flex flex-col h-full relative">
        {loading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C5A041] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-7 bg-[radial-gradient(ellipse_at_top,_rgba(197,160,65,0.02),_transparent_55%)]">
          
          {/* CONTRATS VIEW */}
          {currentNav === 'dashboard' && (
            <div className="max-w-[1500px] mx-auto space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-[25px] lg:text-[29px] font-black text-white">Espace Sponsor</h1>
                  <p className="text-[13px] text-zinc-400 mt-0.5">Tableau de bord centralisé pour vos engagements et activations.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="whitespace-nowrap px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E6C667] via-[#C5A041] to-[#927122] text-neutral-950 font-black text-[13px] shadow-lg shadow-[#C5A041]/10">
                  + Nouveau partenariat
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Contrats actifs</p>
                  <p className="mt-4 text-3xl font-black text-white">{contracts.length}</p>
                  <p className="mt-2 text-sm text-slate-400">Partenariats en cours de gestion.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Budget réservé</p>
                  <p className="mt-4 text-3xl font-black text-white">{formatCurrency(27680000)}</p>
                  <p className="mt-2 text-sm text-slate-400">Dotations engagées pour les prochaines activations.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Visibilité prévue</p>
                  <p className="mt-4 text-3xl font-black text-white">12 campagnes</p>
                  <p className="mt-2 text-sm text-slate-400">Actions programmées pour la saison.</p>
                </div>
              </div>
            </div>
          )}

          {currentNav === 'contrats' && (
            <div className="max-w-[1500px] mx-auto space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-[25px] lg:text-[29px] font-black text-white">Contrats</h1>
                  <p className="text-[13px] text-zinc-400 mt-0.5">Tous vos partenariats et accords commerciaux.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <input 
                    placeholder="Rechercher un partenaire ou contrat..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-4 pr-4 py-2.5 w-full md:w-[280px] bg-[#121215] border border-[#232329] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#C5A041] placeholder-zinc-500"
                  />
                  <button onClick={() => setIsModalOpen(true)} className="whitespace-nowrap px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E6C667] via-[#C5A041] to-[#927122] text-neutral-950 font-black text-[13px] shadow-lg shadow-[#C5A041]/10">
                    + Nouveau partenariat
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {['all', 'en-cours', 'actif', 'renouveler', 'expire'].map((filterId) => (
                  <button
                    key={filterId}
                    onClick={() => setCurrentFilter(filterId as FilterType)}
                    className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition ${
                      currentFilter === filterId ? 'bg-[#C5A041] text-black font-semibold' : 'bg-[#121215] border border-[#1F1F23] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {filterId === 'all' ? 'Tous' : filterId === 'en-cours' ? 'En cours' : filterId === 'actif' ? 'Actifs' : filterId === 'renouveler' ? 'À renouveler' : 'Expirés'}
                  </button>
                ))}
              </div>

              <div className="bg-[#121215] border border-[#1F1F23] rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-[13px] text-left">
                  <thead className="bg-white/[0.02] text-zinc-400 border-b border-[#1F1F23] text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Référence</th>
                      <th className="px-5 py-3.5">Bénéficiaire</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Dotation</th>
                      <th className="px-5 py-3.5">Validité (JJ/MM/AAAA)</th>
                      <th className="px-5 py-3.5">Statut</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F23] text-zinc-300">
                    {filteredContracts.map((contract, i) => (
                      <tr key={i} className="hover:bg-white/[0.01] transition">
                        <td className="px-5 py-4 font-mono text-[#C5A041] font-bold">{contract.ref}</td>
                        <td className="px-5 py-4 font-semibold text-white">{contract.beneficiary}</td>
                        <td className="px-5 py-4 text-zinc-400">{contract.type}</td>
                        <td className="px-5 py-4 font-bold text-white font-mono">{formatCurrency(contract.amount)}</td>
                        <td className="px-5 py-4 font-mono text-zinc-400">
                          {formatDateForDisplay(contract.start_date)} - {formatDateForDisplay(contract.end_date)}
                        </td>
                        <td className="px-5 py-4">
                           <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase ${
                             contract.status === 'Actif' || contract.status === 'En cours'
                               ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                               : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                           }`}>{contract.status}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => setSelectedContract(contract)} className="px-2.5 py-1 text-xs bg-zinc-900 border border-[#232329] rounded-lg text-zinc-300 hover:text-[#C5A041] transition">
                            Inspecter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentNav === 'budget' && (
            <div className="max-w-[1500px] mx-auto space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-[25px] lg:text-[29px] font-black text-white">Budget</h1>
                  <p className="text-[13px] text-zinc-400 mt-0.5">Suivi financier des engagements et actions sponsorisées.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Budget alloué</p>
                  <p className="mt-4 text-3xl font-black text-white">{formatCurrency(45200000)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Débours réalisés</p>
                  <p className="mt-4 text-3xl font-black text-white">{formatCurrency(31240000)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#121215] p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Solde disponible</p>
                  <p className="mt-4 text-3xl font-black text-white">{formatCurrency(13960000)}</p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-[#11131A] p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Prévisions prochaines semaines</h3>
                  <p className="mt-3 text-sm text-slate-300">Réserver le budget communication et hospitalité.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#11131A] p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Actions prioritaires</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    <li>Finaliser la facturation sponsor prioritaire.</li>
                    <li>Valider les bonus visibilité pour le Gala II.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentNav === 'facturation' && (
            <div className="max-w-[1500px] mx-auto space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-[25px] lg:text-[29px] font-black text-white">Facturation</h1>
                  <p className="text-[13px] text-zinc-400 mt-0.5">Suivi des paiements, échéances et relances.</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#121215] p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px] text-left">
                    <thead className="bg-white/[0.02] text-zinc-400 border-b border-[#1F1F23] text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Facture</th>
                        <th className="px-5 py-3.5">Client</th>
                        <th className="px-5 py-3.5">Montant</th>
                        <th className="px-5 py-3.5">Échéance</th>
                        <th className="px-5 py-3.5">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F1F23] text-zinc-300">
                      {[
                        { invoice: "INV-2026-101", client: "Orange Madagascar", amount: "12 000 000 Ar", due: "10/07/2026", status: "En attente" },
                        { invoice: "INV-2026-102", client: "Rakoto MMA Club", amount: "5 500 000 Ar", due: "18/07/2026", status: "Payé" },
                        { invoice: "INV-2026-103", client: "Tana Fight Club", amount: "9 800 000 Ar", due: "24/07/2026", status: "Relance" },
                      ].map((item) => (
                        <tr key={item.invoice} className="hover:bg-white/[0.01] transition">
                          <td className="px-5 py-4 font-mono text-white">{item.invoice}</td>
                          <td className="px-5 py-4 text-white">{item.client}</td>
                          <td className="px-5 py-4 text-slate-300">{item.amount}</td>
                          <td className="px-5 py-4 text-slate-400">{item.due}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                              item.status === 'Payé' ? 'bg-emerald-500/10 text-emerald-300' : item.status === 'En attente' ? 'bg-amber-500/10 text-amber-300' : 'bg-red-500/10 text-red-300'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentNav === 'actifs' && (
            <div className="max-w-[1500px] mx-auto space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-[25px] lg:text-[29px] font-black text-white">Actifs</h1>
                  <p className="text-[13px] text-zinc-400 mt-0.5">Inventaire des ressources marketing et sponsoring.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { asset: "Bâches VIP", qty: 12, status: "Disponible" },
                  { asset: "Packages médias", qty: 8, status: "En cours" },
                  { asset: "Zones activation", qty: 5, status: "Confirmées" },
                ].map((item) => (
                  <div key={item.asset} className="rounded-3xl border border-white/10 bg-[#121215] p-5">
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">{item.asset}</p>
                    <p className="mt-4 text-3xl font-black text-white">{item.qty}</p>
                    <p className="mt-2 text-sm text-slate-400">{item.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentNav === 'juridique' && (
            <div className="max-w-[1500px] mx-auto space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-[25px] lg:text-[29px] font-black text-white">Juridique</h1>
                  <p className="text-[13px] text-zinc-400 mt-0.5">Suivi contractuel, clauses et conformité associée.</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#121215] p-6">
                <h3 className="text-lg font-semibold text-white">État des documents</h3>
                <p className="mt-3 text-sm text-slate-400">Toutes les pièces juridiques essentielles sont rassemblées et prêtes pour vérification.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {[
                    { doc: "Contrat diffusion", status: "Signé" },
                    { doc: "Avenant sponsoring", status: "En cours" },
                    { doc: "Assurance événementielle", status: "Validée" },
                    { doc: "Accréditation équipe", status: "Complète" },
                  ].map((item) => (
                    <div key={item.doc} className="rounded-3xl bg-slate-950/80 border border-white/5 p-4">
                      <p className="text-sm text-slate-500">{item.doc}</p>
                      <p className="mt-3 font-semibold text-white">{item.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentNav === 'equipe' && (
            <div className="max-w-[1500px] mx-auto space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-[25px] lg:text-[29px] font-black text-white">Équipe</h1>
                  <p className="text-[13px] text-zinc-400 mt-0.5">Les collaborateurs et responsables des activations.</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { name: "Lala Mbolatiana", role: "Responsable partenariats", status: "Actif" },
                  { name: "Tiana Rado", role: "Chef de projet", status: "Actif" },
                  { name: "Jean-Pierre Rakotomalala", role: "Analyste ROI", status: "Actif" },
                ].map((member) => (
                  <div key={member.name} className="rounded-3xl border border-white/10 bg-[#121215] p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{member.name}</p>
                      <p className="text-sm text-slate-400">{member.role}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-emerald-300">{member.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentNav === 'rapports' && (
            <div className="max-w-[1500px] mx-auto space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-[25px] lg:text-[29px] font-black text-white">Rapports</h1>
                  <p className="text-[13px] text-zinc-400 mt-0.5">Exports, synthèses et indicateurs clés de performance.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { title: "Rapport sponsor 2026", status: "Prêt" },
                  { title: "Synthèse billetterie", status: "À générer" },
                  { title: "Performance média", status: "En cours" },
                ].map((report) => (
                  <div key={report.title} className="rounded-3xl border border-white/10 bg-[#121215] p-5">
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">{report.title}</p>
                    <p className="mt-4 font-semibold text-white">{report.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <MessageWorkspace />
      </div>

      {/* MODALE CADRÉE SANS SCROLL - COMPACTE ET FLUIDE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/85 backdrop-blur-xs" />
          
          <div className="relative w-full max-w-2xl bg-[#111114] border border-[#24242B] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
            <div className="px-6 py-3.5 border-b border-[#1F1F23] flex items-center justify-between bg-white/[0.01]">
              <div>
                <h3 className="font-bold text-white text-sm tracking-tight uppercase">Nouvel Engagement Sponsoring</h3>
                <p className="text-[10px] text-zinc-400">Enregistrement instantané des clauses cloud</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white text-sm">✕</button>
            </div>
            
            <form onSubmit={handleCreateContract} className="p-5 space-y-3.5 text-[11px]">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-medium">Bénéficiaire ou Structure <span className="text-[#C5A041]">*</span></label>
                  <input 
                    type="text" required placeholder="Ligue, Club, Athlète..." 
                    value={formData.beneficiary} onChange={(e) => setFormData({...formData, beneficiary: e.target.value})} 
                    className="w-full px-3 py-2 bg-[#16161A] border border-[#232329] rounded-xl text-white outline-none focus:border-[#C5A041]" 
                  />
                </div>
                
                {/* SAISIE MONTANT AVEC SÉPARATEUR DE MILLIERS EN TEMPS RÉEL */}
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-medium">Dotation Financière Brut (Ar) <span className="text-[#C5A041]">*</span></label>
                  <input 
                    type="text" required placeholder="Ex: 5 000 000" 
                    value={formData.amount} 
                    onChange={(e) => {
                      const formattedValue = formatInputWithSpaces(e.target.value);
                      setFormData({...formData, amount: formattedValue});
                    }} 
                    className="w-full bg-[#16161A] border border-[#232329] p-2 rounded-xl text-white outline-none focus:border-[#C5A041] font-mono text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-medium">Type de convention</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full bg-[#16161A] border border-[#232329] p-2 rounded-xl text-white outline-none focus:border-[#C5A041]">
                    <option>Combattant Pro</option>
                    <option>Athlète Élite</option>
                    <option>Événement</option>
                    <option>Club Affilié</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-medium">Manager du dossier</label>
                  <select value={formData.manager} onChange={(e) => setFormData({...formData, manager: e.target.value})} className="w-full bg-[#16161A] border border-[#232329] p-2 rounded-xl text-white outline-none focus:border-[#C5A041]">
                    <option>M. Razafy</option>
                    <option>R. Andriamahefa</option>
                  </select>
                </div>
              </div>

              {/* CALENDRIERS VISUELS NATIFS SANS TEXTE À TAPPER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-medium">Date de début du contrat <span className="text-[#C5A041]">*</span></label>
                  <input 
                    type="date" required 
                    value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                    className="w-full bg-[#16161A] border border-[#232329] p-2 rounded-xl text-white outline-none focus:border-[#C5A041] scheme-dark cursor-pointer font-mono" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-medium">Date de fin du contrat <span className="text-[#C5A041]">*</span></label>
                  <input 
                    type="date" required 
                    value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                    className="w-full bg-[#16161A] border border-[#232329] p-2 rounded-xl text-white outline-none focus:border-[#C5A041] scheme-dark cursor-pointer font-mono" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-medium">Statut</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-[#16161A] border border-[#232329] p-2 rounded-xl text-white outline-none focus:border-[#C5A041]">
                    <option>En cours</option>
                    <option>Actif</option>
                    <option>À renouveler</option>
                    <option>Expiré</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-400 font-medium">Facturation & Flux</label>
                  <select value={formData.payment} onChange={(e) => setFormData({...formData, payment: e.target.value})} className="w-full bg-[#16161A] border border-[#232329] p-2 rounded-xl text-white outline-none focus:border-[#C5A041]">
                    <option>Acompte requis</option>
                    <option>Acompte versé</option>
                    <option>T3 Payé</option>
                    <option>Soldé</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-400 font-medium">Clauses et Contreparties</label>
                <textarea 
                  rows={2} placeholder="Marquage maillot, bâche d'octogone, posts réseaux sociaux..." 
                  value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} 
                  className="w-full bg-[#16161A] border border-[#232329] p-2 rounded-xl text-white outline-none focus:border-[#C5A041] resize-none" 
                />
              </div>

              <div className="pt-3 border-t border-[#1F1F23] flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-zinc-900 border border-[#232329] text-zinc-400 hover:text-white font-medium transition">
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E6C667] via-[#C5A041] to-[#927122] text-black font-black transition hover:brightness-110 shadow-md">
                  Valider l&apos;Engagement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIROIR D'INSPECTION DÉTAILLÉ */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setSelectedContract(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <aside className="relative w-full sm:w-[500px] h-full bg-[#111113] border-l border-[#1F1F23] flex flex-col shadow-2xl z-10">
            <div className="h-[68px] flex items-center justify-between px-5 border-b border-[#1F1F23] bg-black/20">
              <div>
                <div className="font-mono text-[14.5px] text-[#E6C667] font-black">{selectedContract.ref}</div>
                <div className="text-[11px] text-zinc-400 font-medium">{selectedContract.type}</div>
              </div>
              <button onClick={() => setSelectedContract(null)} className="w-8 h-8 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-center text-zinc-400">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="bg-[#16161A] border border-[#232329] rounded-2xl p-4 space-y-3">
                <h4 className="text-[11px] font-bold uppercase text-[#C5A041]">Métadonnées de la table</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-zinc-500 block">Bénéficiaire :</span> <b className="text-white">{selectedContract.beneficiary}</b></div>
                  <div><span className="text-zinc-500 block">Dotation :</span> <b className="text-[#E6C667] font-mono">{formatCurrency(selectedContract.amount)}</b></div>
                  <div><span className="text-zinc-500 block">Effet :</span> <span className="text-zinc-300 font-mono">{formatDateForDisplay(selectedContract.start_date)}</span></div>
                  <div><span className="text-zinc-500 block">Échéance :</span> <span className="text-zinc-300 font-mono">{formatDateForDisplay(selectedContract.end_date)}</span></div>
                  <div><span className="text-zinc-500 block">Manager :</span> <span className="text-zinc-300">{selectedContract.manager}</span></div>
                  <div><span className="text-zinc-500 block">Statut :</span> <span className="text-zinc-300 font-semibold">{selectedContract.status}</span></div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* TOAST FLOTTANT */}
      {toast.show && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#121215] border border-[#C5A041]/40 px-6 py-3 rounded-xl text-xs text-white shadow-2xl">
          {toast.msg}
        </div>
      )}

    </div>
  );
</ErpAuthGuard>
  );
}
