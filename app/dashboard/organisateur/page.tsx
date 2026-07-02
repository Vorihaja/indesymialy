"use client";
import { useEffect, useState } from 'react';
import { useDisciplineFilter } from '@/app/discipline-filter-context';
import { supabase } from '@/lib/supabase';
import MessageWorkspace from '../messages/MessageWorkspace';
import ErpAuthGuard from '../ErpAuthGuard';

type RemoteFighter = {
  id?: string;
  name?: string;
  cat?: string;
  record?: string;
  club?: string;
  status?: string;
  country?: string;
  contract?: string;
  medical?: string;
  weight?: string;
  height?: string;
  age?: number;
  bio?: string;
};

type EventType = {
  id: number;
  name: string;
  city?: string;
  venue?: string;
  date?: string;
  status?: string;
  statusColor?: string;
  fighters?: number;
  tickets?: number;
  capacity?: number;
  budget?: number;
  color?: string;
};

export default function SaasOrganisateur() {
  // Navigation principale de l'ERP
  const [currentNav, setCurrentNav] = useState<'dashboard' | 'evenements' | 'combattants' | 'financier' | 'billetterie' | 'staff' | 'logistique' | 'juridique' | 'live' | 'rapports'>('evenements');
  
  // Onglets à l'intérieur de la vue détail d'un événement
  const [activeTab, setActiveTab] = useState<'apercu' | 'fightcard' | 'combattants' | 'budget' | 'billetterie' | 'staff' | 'juridique'>('apercu');
  
  // Sélection de l'événement courant (null = liste des événements)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fighterQuery, setFighterQuery] = useState("");
  const [toast, setToast] = useState<{ show: boolean; msg: string; icon: string }>({ show: false, msg: "", icon: "🔔" });
  const [remoteFighters, setRemoteFighters] = useState<RemoteFighter[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // État pour gérer la vue modale du "Profil Public" d'un combattant
  const [selectedFighterProfile, setSelectedFighterProfile] = useState<RemoteFighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRemoteFighters = async () => {
      setLoading(true);
      setRemoteError(null);
      const { data, error } = await supabase.from('fighters').select('*');
      if (error) {
        const message = error.message || 'Erreur de lecture Supabase';
        console.error('Supabase fighters fetch error:', error);
        setRemoteError(message);
      } else {
        setRemoteFighters((data || []) as RemoteFighter[]);
      }
      setLoading(false);
    };

    fetchRemoteFighters();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      setEventsError(null);
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (error) {
        const message = error.message || 'Erreur de lecture Supabase';
        console.error('Supabase events fetch error:', error);
        setEventsError(message);
      } else if (data) {
        setEvents(
          (data as any[]).map((event) => ({
            id: Number(event.id ?? event.event_id ?? 0),
            name: event.name ?? event.title ?? 'Événement',
            city: event.city ?? event.location_city ?? '—',
            venue: event.venue ?? event.location_venue ?? '—',
            date: event.date ?? event.start_date ?? undefined,
            status: event.status ?? 'Planifié',
            statusColor: event.status_color ?? event.statusColor ?? 'blue',
            fighters: Number(event.fighters ?? event.fighters_count ?? 0),
            tickets: Number(event.tickets ?? event.tickets_sold ?? 0),
            capacity: Number(event.capacity ?? 0),
            budget: Number(event.budget ?? 0),
            color: event.color ?? 'from-blue-900/40 to-[#0F172A]',
          }))
        );
      }
      setLoadingEvents(false);
    };

    fetchEvents();
  }, []);

  const fallbackEvents: EventType[] = [
    { id: 1, name: "MAHAJANGA FIGHT NIGHT", city: "Mahajanga", venue: "Complexe Sportif Mahajanga", date: "2026-07-12", status: "En préparation", statusColor: "amber", fighters: 14, tickets: 8472, capacity: 12000, budget: 48500000, color: "from-red-900/40 to-[#0F172A]" },
    { id: 2, name: "INDESY MIALY GALA II", city: "Antananarivo", venue: "Palais des Sports Mahamasina", date: "2026-09-20", status: "Planifié", statusColor: "blue", fighters: 12, tickets: 3120, capacity: 9000, budget: 32000000, color: "from-violet-900/30 to-[#0F172A]" },
    { id: 3, name: "BOENY COMBAT CHALLENGE", city: "Mahajanga", venue: "Plage du Village Touristique", date: "2026-11-05", status: "Brouillon", statusColor: "zinc", fighters: 0, tickets: 0, capacity: 4500, budget: 0, color: "from-zinc-800/40 to-[#0F172A]" },
  ];
  const eventList = events.length > 0 ? events : fallbackEvents;
  const showFallbackEvents = Boolean(eventsError || events.length === 0);

  // 2. Data Source : Fight Cards
  const fightCards: Record<number, Array<{ n: number; title: string; fighterA: string; fighterB: string; cat: string; type: string; status: string }>> = {
    1: [
      { n: 1, title: "RAZAFINDRAKOTO vs RAKOTO", fighterA: "Razafindrakoto Faly", fighterB: "Rakoto Jean", cat: "MMA -77 kg", type: "MAIN EVENT", status: "Confirmé" },
      { n: 2, title: "NANDRIANINA vs RINDRA", fighterA: "Nandrianina 'Laza'", fighterB: "Rindra 'Gasy'", cat: "Moraingy Open", type: "CO-MAIN", status: "Confirmé" },
      { n: 3, title: "ANDRIANINA vs RANDRIAMAHAZO", fighterA: "Andrianina Tojo", fighterB: "Randriamahazo", cat: "Judo -90 kg", type: "", status: "Confirmé" },
      { n: 4, title: "RAMAMONJISOA vs RAZAFIARISON", fighterA: "Ramamonjisoa", fighterB: "Razafiarison", cat: "MMA -66 kg", type: "", status: "Confirmé" },
      { n: 5, title: "HERINIAINA vs RABE", fighterA: "Heriniaina", fighterB: "Rabe", cat: "Moraingy -65 kg", type: "", status: "Visite médicale" },
      { n: 6, title: "RANDRIANASOLO vs RALAIVAO", fighterA: "Randrianasolo", fighterB: "Ralaivao", cat: "MMA -70 kg", type: "", status: "Contrat envoyé" },
      { n: 7, title: "TOVONDRY vs ANDRIAMALALA", fighterA: "Tovondry", fighterB: "Andriamalala", cat: "Judo -73 kg", type: "", status: "Confirmé" },
    ]
  };

  // 3. Data Source : Combattants enrichis avec stats publiques
  const fighters = remoteFighters.length > 0 ? remoteFighters : [
    { name: "Razafindrakoto Faly", cat: "MMA -77 kg", country: "MG", contract: "Signé", medical: "OK", weight: "76.8 kg", status: "Prêt", record: "12-2-0", club: "Atsimondrano MMA Team", height: "182 cm", age: 26, bio: "Spécialiste du combat au sol et ancien médaillé de lutte." },
    { name: "Rakoto Jean", cat: "MMA -77 kg", country: "MG", contract: "Signé", medical: "OK", weight: "77.1 kg", status: "Prêt", record: "9-4-1", club: "Tana Fight Club", height: "178 cm", age: 28, bio: "Striker explosif réputé pour son kickboxing agressif." },
    { name: "Nandrianina 'Laza'", cat: "Moraingy Open", country: "MG", contract: "Signé", medical: "OK", weight: "82.4 kg", status: "Surveillance", record: "18-1-0", club: "Fianarantsoa Moraingy Elite", height: "185 cm", age: 24, bio: "Invaincu sur la côte Ouest en choc traditionnel Fandatika." },
    { name: "Rindra 'Gasy'", cat: "Moraingy Open", country: "MG", contract: "Signé", medical: "OK", weight: "80.9 kg", status: "Prêt", record: "14-3-2", club: "Majunga Sika Club", height: "180 cm", age: 25, bio: "Expert en techniques d'esquive et contre-attaques rapides." },
    { name: "Andrianina Tojo", cat: "Judo -90 kg", country: "MG", contract: "Signé", medical: "En attente", weight: "89.5 kg", status: "Prêt", record: "22-5-0", club: "Académie Nationale de Judo", height: "175 cm", age: 29, bio: "Ceinture noire 2ème Dan, triple champion de Madagascar." },
  ];

  // Helper pour trouver ou générer un profil par défaut si non listé explicitement
  const openFighterPublicProfile = (name: string) => {
    const found = fighters.find(f => f.name.toLowerCase() === name.toLowerCase());
    if (found) {
      setSelectedFighterProfile(found);
    } else {
      // Profil générique dynamique si l'athlète n'est pas encore dans la base statique
      setSelectedFighterProfile({
        name,
        cat: "Athlète Élite",
        country: "MG",
        contract: "En cours",
        medical: "À vérifier",
        weight: "NC",
        status: "En attente",
        record: "0-0-0",
        club: "Club Affilié Indesy",
        height: "180 cm",
        age: 23,
        bio: "Fiche athlète certifiée par la ligue régionale."
      });
    }
    showNotification(`Chargement du profil public de ${name}`, "👤");
  };

  // Helper pour afficher les alertes de toast
  const showNotification = (msg: string, icon = "🔔") => {
    setToast({ show: true, msg, icon });
    setTimeout(() => setToast({ show: false, msg: "", icon: "🔔" }), 3500);
  };

  // Formatage Ar sans erreur d'hydration SSR
  const formatCurrency = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Ar";
  };

  const openMetricDetails = (metricName: string, targetTab: 'apercu' | 'fightcard' | 'combattants' | 'budget' | 'billetterie' | 'staff' | 'juridique') => {
    showNotification(`Rapport analytique : ${metricName}`, "📈");
    setActiveTab(targetTab);
  };

  // Filtrage intelligent
  const { selectedDisciplines } = useDisciplineFilter();
  const currentEvent = eventList.find(e => e.id === selectedEventId) || eventList[0];
  const filteredFightCard = (fightCards[currentEvent.id] || []).filter((fight) =>
    selectedDisciplines.length === 0
      ? true
      : selectedDisciplines.some((discipline) => fight.cat.includes(discipline))
  );
  const filteredFighters = fighters
    .filter((f) => f.name.toLowerCase().includes(fighterQuery.toLowerCase()))
    .filter((f) =>
      selectedDisciplines.length === 0
        ? true
        : selectedDisciplines.some((discipline) => f.cat.includes(discipline))
    );

  return (
    <ErpAuthGuard>
      <div className="flex h-screen overflow-hidden bg-[#0A0A0B] text-gray-200 antialiased font-sans">
      
      {/* 1. SIDEBAR GAUCHE */}
      <aside className="fixed inset-y-0 left-0 z-40 w-[80px] md:w-[280px] bg-[#0F172A] border-r border-slate-800 flex flex-col transition-all duration-300 shadow-2xl">
        <div className="h-[68px] flex items-center gap-3 px-3 md:px-5 border-b border-slate-800/80 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DC2626] to-[#7f1d1d] flex items-center justify-center font-black text-white text-[18px] shadow-lg shrink-0">
            IM
          </div>
          <div className="hidden md:block min-w-0">
            <div className="font-extrabold text-[17px] leading-tight tracking-tight">Votre Profil</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-widest font-medium -mt-0.5">Espace Organisateur</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 md:px-3 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'evenements', label: 'Événements', badge: '3' },
            { id: 'combattants', label: 'Combattants', badge: '247' },
            { id: 'financier', label: 'Financier' },
            { id: 'billetterie', label: 'Billetterie' },
            { id: 'staff', label: 'Staff', badge: '23' },
            { id: 'logistique', label: 'Logistique' },
            { id: 'juridique', label: 'Juridique' },
            { id: 'live', label: 'Jour-J LIVE', pulse: true },
            { id: 'rapports', label: 'Rapports' },
          ].map((item) => {
            const isActive = currentNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  // @ts-ignore
                  setCurrentNav(item.id);
                  if (item.id !== 'evenements') setSelectedEventId(null);
                }}
                className={`w-full group flex items-center justify-center md:justify-start px-4 py-3 rounded-xl text-[14px] font-medium transition-all relative ${
                  isActive 
                    ? 'bg-[#DC2626]/15 text-white ring-1 ring-inset ring-[#DC2626]/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] bg-[#DC2626] rounded-r-full hidden md:block" />
                )}
                <span className="truncate flex-1 text-center md:text-left">{item.label}</span>
                {item.badge && (
                  <span className={`hidden md:inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-bold rounded-md ml-auto ${isActive ? 'bg-[#DC2626] text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
                {item.pulse && (
                  <span className="hidden md:block w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-auto" />
                )}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* 2. ZONE PRINCIPALE */}
      <div className="flex-1 ml-[80px] md:ml-[280px] flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-[68px] bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 flex items-center gap-3 px-4 md:px-6 shrink-0 z-30">
          <div className="flex-1 flex justify-center max-w-2xl mx-auto w-full">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
              <input 
                type="text" 
                placeholder="Recherche globale (athlètes, transactions...)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-[#14151A] border border-white/10 rounded-xl text-[14px] placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/50 focus:border-[#DC2626]/50 transition" 
              />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button 
              onClick={() => showNotification("Aucune nouvelle alerte critique", "🔔")}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#14151A] border border-white/10 hover:bg-white/5 transition text-zinc-400 hover:text-white"
            >
              <span>🔔</span>
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 flex items-center justify-center bg-[#DC2626] text-white text-[11px] font-bold rounded-full ring-2 ring-[#0A0A0B]">2</span>
            </button>
          </div>
        </header>

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 overflow-y-auto">
          
          {selectedEventId === null ? (
            /* VUE LISTE DES ÉVÉNEMENTS */
            <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
              <div>
                <h1 className="text-[28px] md:text-[32px] font-extrabold tracking-tight">Événements</h1>
                <p className="text-zinc-400 text-[14px] mt-1">Gérez vos hubs de combat actifs à Madagascar</p>
              </div>

              {showFallbackEvents && (
                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {eventsError
                    ? `Impossible de charger les événements depuis Supabase : ${eventsError}. Affichage des événements de démonstration.`
                    : 'Aucun événement enregistré pour le moment. Affichage des événements de démonstration.'}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {eventList.map((event) => (
                  <div 
                    key={event.id}
                    onClick={() => { setSelectedEventId(event.id); setCurrentNav('evenements'); }}
                    className={`bg-gradient-to-br ${event.color} border border-white/5 rounded-2xl p-5 hover:border-white/10 cursor-pointer transition-all duration-200 group flex flex-col justify-between min-h-[220px] shadow-lg`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">{event.city} • {event.venue}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          event.statusColor === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                          event.statusColor === 'blue' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>{event.status}</span>
                      </div>
                      <h3 className="text-[19px] font-black text-white mt-2 group-hover:text-[#DC2626] transition-colors">{event.name}</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 text-[12px] text-zinc-400 mt-4">
                      <div><span className="block font-bold text-white text-[14px]">{event.fighters}</span>Combats</div>
                      <div><span className="block font-bold text-white text-[14px]">{event.tickets.toLocaleString()}</span>Billets</div>
                      <div><span className="block font-bold text-white text-[14px]">{event.budget > 0 ? formatCurrency(event.budget) : 'N/A'}</span>Budget</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            
            /* DÉTAIL DE L'ÉVÉNEMENT SELECTIONNÉ */
            <div className="space-y-0">
              <div className="sticky top-0 z-20 bg-[#0A0A0B]/90 backdrop-blur-xl border-b border-white/5">
                <div className="px-4 md:px-6 lg:px-8 py-4 max-w-[1600px] mx-auto">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedEventId(null)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#14151A] border border-white/10 text-zinc-400">&larr;</button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-[22px] md:text-[26px] font-bold leading-tight truncate text-white">{currentEvent.name}</h1>
                      <p className="text-[13px] text-zinc-400">{currentEvent.venue} &bull; {currentEvent.city}</p>
                    </div>
                  </div>
                </div>

                {/* ONGLETS INTERNES */}
                <div className="px-2 md:px-6 lg:px-8 max-w-[1600px] mx-auto overflow-x-auto">
                  <div className="flex gap-1 min-w-max">
                    {[
                      { id: 'apercu', label: 'Aperçu' },
                      { id: 'fightcard', label: 'Fight Card' },
                      { id: 'combattants', label: 'Combattants' },
                      { id: 'budget', label: 'Budget' },
                      { id: 'billetterie', label: 'Billetterie' },
                      { id: 'staff', label: 'Staff' },
                      { id: 'juridique', label: 'Juridique' },
                    ].map((tab) => {
                      const isTabActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          // @ts-ignore
                          onClick={() => { setActiveTab(tab.id); }}
                          className={`px-4 py-3 text-[14px] font-medium border-b-2 whitespace-nowrap transition-all ${
                            isTabActive ? 'border-[#DC2626] text-white' : 'border-transparent text-zinc-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
                {loading && (
                  <div className="mb-6 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                    Chargement des combattants depuis Supabase...
                    {remoteError ? ` Erreur : ${remoteError}` : ''}
                  </div>
                )}
                
                {/* 1. ONGLET APERCU */}
                {activeTab === 'apercu' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      <button onClick={() => openMetricDetails("Planification", "apercu")} className="bg-[#11131A] border border-white/10 rounded-2xl p-4 text-left transition hover:bg-white/[0.02] group block w-full">
                        <div className="text-[12px] text-zinc-500 uppercase font-medium">Jours restants</div>
                        <div className="text-[28px] font-extrabold mt-1 text-white group-hover:text-[#DC2626]">47</div>
                        <div className="text-[12px] text-emerald-400 mt-1 underline decoration-dotted">Voir le rétroplanning &rarr;</div>
                      </button>

                      <button onClick={() => openMetricDetails("Validation Fight Card", "fightcard")} className="bg-[#11131A] border border-white/10 rounded-2xl p-4 text-left transition hover:bg-white/[0.02] group block w-full">
                        <div className="text-[12px] text-zinc-500 uppercase font-medium">Fight Card</div>
                        <div className="text-[28px] font-extrabold mt-1 text-white group-hover:text-[#DC2626]">7 / 8</div>
                        <div className="text-[12px] text-amber-400 mt-1 underline decoration-dotted">1 combat en attente &rarr;</div>
                      </button>

                      <button onClick={() => openMetricDetails("Ventes Billetterie", "billetterie")} className="bg-[#11131A] border border-white/10 rounded-2xl p-4 text-left transition hover:bg-white/[0.02] group block w-full">
                        <div className="text-[12px] text-zinc-500 uppercase font-medium">Places vendues</div>
                        <div className="text-[28px] font-extrabold mt-1 text-white group-hover:text-[#DC2626]">8 472</div>
                        <div className="text-[12px] text-zinc-400 mt-1 underline decoration-dotted">71% de la capacité &rarr;</div>
                      </button>

                      <button onClick={() => openMetricDetails("Flux financier", "budget")} className="bg-[#11131A] border border-white/10 rounded-2xl p-4 text-left transition hover:bg-white/[0.02] group block w-full">
                        <div className="text-[12px] text-zinc-500 uppercase font-medium">Budget Restant</div>
                        <div className="text-[28px] font-extrabold mt-1 text-white group-hover:text-[#DC2626]">17.2M</div>
                        <div className="text-[12px] text-emerald-400 mt-1 underline decoration-dotted">+12% de marge &rarr;</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. ONGLET FIGHT CARD (RENVOIE VERS LE PROFIL PUBLIC) */}
                {activeTab === 'fightcard' && (
                  <div className="bg-[#11131A] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[14px] text-left">
                        <thead className="bg-white/[0.02] text-[12px] uppercase text-zinc-500">
                          <tr>
                            <th className="p-4">Ordre</th>
                            <th className="p-4">Affiche de l'Affrontement (Lien profil public)</th>
                            <th className="p-4">Discipline / Catégorie</th>
                            <th className="p-4">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                          {filteredFightCard.map((fight) => (
                            <tr key={fight.n} className="hover:bg-white/[0.01]">
                              <td className="p-4 font-mono font-bold">{fight.n}</td>
                              <td className="p-4">
                                <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                                  {/* Boutons d'accès au profil public */}
                                  <button 
                                    onClick={() => openFighterPublicProfile(fight.fighterA)}
                                    className="text-left text-red-400 hover:text-red-300 hover:underline transition-all"
                                  >
                                    {fight.fighterA}
                                  </button>
                                  <span className="text-zinc-500 font-normal px-1">vs</span>
                                  <button 
                                    onClick={() => openFighterPublicProfile(fight.fighterB)}
                                    className="text-left text-red-400 hover:text-red-300 hover:underline transition-all"
                                  >
                                    {fight.fighterB}
                                  </button>
                                  {fight.type && <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded ml-2">{fight.type}</span>}
                                </div>
                              </td>
                              <td className="p-4 text-zinc-400">{fight.cat}</td>
                              <td className="p-4">
                                <span className="text-emerald-400 text-xs font-semibold">{fight.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. ONGLET COMBATTANTS (RENVOIE VERS LE PROFIL PUBLIC) */}
                {activeTab === 'combattants' && (
                  <div className="bg-[#11131A] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                      <input 
                        type="text" 
                        placeholder="Filtrer un athlète..." 
                        value={fighterQuery}
                        onChange={(e) => setFighterQuery(e.target.value)}
                        className="h-9 px-3 bg-[#0A0A0B] border border-white/10 rounded-lg text-[13px] w-full sm:w-64 focus:outline-none text-white"
                      />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[13px] text-left">
                        <thead className="bg-white/[0.02] text-[11px] uppercase text-zinc-500">
                          <tr>
                            <th className="p-4">Nom de l'Athlète (Profil Public)</th>
                            <th className="p-4">Division</th>
                            <th className="p-4">Palmarès (Record)</th>
                            <th className="p-4">Club d'origine</th>
                            <th className="p-4">Disponibilité</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                          {filteredFighters.map((f, i) => (
                            <tr key={i} className="hover:bg-white/[0.01]">
                              <td className="p-4">
                                <button 
                                  onClick={() => openFighterPublicProfile(f.name)}
                                  className="font-bold text-red-400 text-left hover:text-red-300 hover:underline block focus:outline-none"
                                >
                                  {f.name}
                                </button>
                              </td>
                              <td className="p-4 text-zinc-400">{f.cat}</td>
                              <td className="p-4 font-mono text-white font-bold">{f.record}</td>
                              <td className="p-4 text-zinc-400">{f.club}</td>
                              <td className="p-4">
                                <span className="w-2 h-2 inline-block rounded-full mr-2 bg-emerald-500" />
                                {f.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. ONGLET BUDGET */}
                {activeTab === 'budget' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button onClick={() => openMetricDetails("Recettes", "billetterie")} className="bg-[#11131A] border border-white/10 rounded-2xl p-5 text-left group">
                        <div className="text-[12px] text-zinc-500 uppercase">Recettes globales</div>
                        <div className="text-[26px] font-bold mt-1 text-white group-hover:text-[#DC2626]">{formatCurrency(48500000)}</div>
                      </button>
                      <button onClick={() => showNotification("Détail des factures")} className="bg-[#11131A] border border-white/10 rounded-2xl p-5 text-left group">
                        <div className="text-[12px] text-zinc-500 uppercase">Dépenses engagées</div>
                        <div className="text-[26px] font-bold mt-1 text-white group-hover:text-amber-500">{formatCurrency(31240000)}</div>
                      </button>
                      <button onClick={() => showNotification("Rentabilité brute")} className="bg-[#11131A] border border-white/10 rounded-2xl p-5 text-left group">
                        <div className="text-[12px] text-zinc-500 uppercase">Marge nette</div>
                        <div className="text-[26px] font-bold mt-1 text-emerald-400">{formatCurrency(17260000)}</div>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-3xl border border-white/10 bg-[#11131A] p-5">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Plan de trésorerie</h3>
                        <p className="mt-3 text-sm text-slate-300">La trésorerie reste stable, avec un focus sur les encaissements billetterie.</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-[#11131A] p-5">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Priorités</h3>
                        <ul className="mt-3 space-y-2 text-sm text-slate-300">
                          <li>Optimiser la marge sponsoring.</li>
                          <li>Bloquer les flux de trésorerie du jour J.</li>
                          <li>Suivre les créances des partenaires.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. ONGLET STAFF */}
                {activeTab === 'staff' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-3xl border border-white/10 bg-[#11131A] p-5">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Équipe événementielle</h3>
                        <ul className="mt-4 space-y-3 text-sm text-slate-300">
                          <li className="rounded-3xl bg-slate-950/80 p-4 border border-white/5">Directeur de production : <span className="font-semibold text-white">Sitraka Andrianarivo</span></li>
                          <li className="rounded-3xl bg-slate-950/80 p-4 border border-white/5">Responsable sécurité : <span className="font-semibold text-white">Noro Randriamampionona</span></li>
                          <li className="rounded-3xl bg-slate-950/80 p-4 border border-white/5">Logistique : <span className="font-semibold text-white">Mamy Rabezavana</span></li>
                        </ul>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-[#11131A] p-5">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Actions clés</h3>
                        <ul className="mt-4 space-y-3 text-sm text-slate-300">
                          <li>Finaliser la validation des accréditations.</li>
                          <li>Confirmer le staffing de la zone VIP.</li>
                          <li>Vérifier le protocole d’évacuation.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. ONGLET JURIDIQUE */}
                {activeTab === 'juridique' && (
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-[#11131A] p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">Conformité juridique</h3>
                          <p className="text-sm text-slate-400">Contrats et obligations à jour.</p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-4">
                          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Assurances</p>
                          <p className="mt-3 text-white">Assurance événement couverte jusqu’au 23/11/2026.</p>
                        </div>
                        <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-4">
                          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Contrats clés</p>
                          <p className="mt-3 text-white">Accord salle, exploitation média et sécurité finalisés.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-[#11131A] p-5">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Points d’attention</h4>
                      <ul className="mt-4 space-y-3 text-sm text-slate-300">
                        <li>Valider la RLS pour les licences de staff de sécurité.</li>
                        <li>Signer l’avenant de diffusion pour la retransmission TV.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 7. ONGLET BILLETTERIE */}
                {activeTab === 'billetterie' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { cat: "Catégorie 1 • Ringside VIP", sold: 1024, max: 1200, pu: 150000 },
                      { cat: "Catégorie 2 • Tribune Premium", sold: 3847, max: 5000, pu: 75000 },
                      { cat: "Catégorie 3 • Pelouse / Standard", sold: 3601, max: 5800, pu: 30000 }
                    ].map((ticket, idx) => (
                      <div key={idx} className="bg-[#11131A] border border-white/10 rounded-2xl p-5">
                        <div className="text-[12px] text-zinc-500">{ticket.cat}</div>
                        <button onClick={() => showNotification(`Acheteurs catégorie ${idx+1}`)} className="text-[24px] font-bold mt-1 text-white hover:text-[#DC2626]">
                          {ticket.sold.toLocaleString()} <span className="text-[14px] text-zinc-500 font-normal">/ {ticket.max.toLocaleString()}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}
        </main>

        <MessageWorkspace />
      </div>

      {/* MODALE CONTEXTUELLE : FICHE PROFIL PUBLIC DU COMBATTANT */}
      {selectedFighterProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#11131A] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            
            {/* Banner Modale */}
            <div className="h-24 bg-gradient-to-r from-red-950 to-slate-900 p-5 flex items-end relative">
              <button 
                onClick={() => setSelectedFighterProfile(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 border border-white/10 text-white text-sm hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
              <div>
                <span className="text-[10px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  Profil Public Ligue
                </span>
                <h2 className="text-xl font-black text-white mt-1">{selectedFighterProfile.name}</h2>
              </div>
            </div>

            {/* Contenu Profil */}
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2 text-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                <div>
                  <div className="text-[11px] text-zinc-500 uppercase">Record Pro</div>
                  <div className="text-base font-mono font-black text-emerald-400">{selectedFighterProfile.record}</div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500 uppercase">Division</div>
                  <div className="text-[13px] font-bold text-zinc-300 truncate">{selectedFighterProfile.cat}</div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500 uppercase">Âge</div>
                  <div className="text-base font-bold text-zinc-300">{selectedFighterProfile.age} ans</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-white/5 pb-1.5 text-zinc-400">
                  <span>Club :</span>
                  <span className="text-white font-medium">{selectedFighterProfile.club}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5 text-zinc-400">
                  <span>Taille & Poids :</span>
                  <span className="text-white font-mono">{selectedFighterProfile.height} • {selectedFighterProfile.weight}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5 text-zinc-400">
                  <span>Nationalité :</span>
                  <span className="text-white font-medium">🇲🇬 Madagascar ({selectedFighterProfile.country})</span>
                </div>
              </div>

              <div>
                <div className="text-[12px] text-zinc-500 mb-1 font-medium">Biographie / Style de combat :</div>
                <p className="text-zinc-300 leading-relaxed text-[13px] bg-white/[0.01] p-2.5 rounded-lg border border-white/5 italic">
                  "{selectedFighterProfile.bio}"
                </p>
              </div>
            </div>

            {/* Pied de modale */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2">
              <button 
                onClick={() => {
                  showNotification(`Lien de partage copié pour ${selectedFighterProfile.name}`);
                  setSelectedFighterProfile(null);
                }} 
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
              >
                🔗 Copier le lien public
              </button>
              <button 
                onClick={() => setSelectedFighterProfile(null)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FLOTTANT */}
      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#11131A] border border-white/15 px-4 py-2.5 rounded-xl shadow-2xl text-[13px] font-medium flex items-center gap-2 text-white">
            <span>{toast.icon}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

    </div>
    </ErpAuthGuard>
  );
}

