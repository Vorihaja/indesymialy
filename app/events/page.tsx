"use client";

import { useState } from "react";
import { 
  Calendar, MapPin, Trophy, Ticket, ChevronRight, 
  Award, ShoppingBag, Clock, HelpCircle, AlertTriangle,
  Flame, Star, Info
} from "lucide-react";

// Données complètes du Gala de Mahajanga
const FEATURED_GALA = {
  id: "mfn-3",
  title: "MAHAJANGA FIGHT NIGHT - VOL.3",
  subtitle: "L'ÉLITE DU MMA ET DU KICKBOXING MALAGASY",
  discipline: "MMA / Kickboxing",
  date: "28 Juillet 2026",
  time: "18:00",
  location: "Complexe Sportif Ampisikina, Mahajanga",
  description: "Le plus grand événement de sports de combat de la province de Boeny est de retour. 12 combats professionnels, ceintures en jeu, et une ambiance électrique. Un show unique alliant lumière, et performance athlétique pure.",
  priceFrom: "15 000 Ar",
  vipPrice: "100 000 Ar",
  // Image haute résolution pour le fond fixe
  backgroundImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop",
  
  fightCard: [
    {
      type: "MAIN EVENT",
      weightClass: "Poids Welters (-77 kg) • Ceinture MFN",
      fighterA: { name: "Rova 'The Eagle' Rakotonirina", record: "12-2-0", club: "Tana MMA Club", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" },
      fighterB: { name: "Jean 'Liona' Razafindrakoto", record: "10-1-0", club: "Mahajanga Combat Academy", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" },
    },
    {
      type: "CO-MAIN EVENT",
      weightClass: "Poids Légers (-70 kg)",
      fighterA: { name: "Andry 'Le Python' Tokiniana", record: "8-3-0", club: "Apex Martial Arts", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
      fighterB: { name: "Mamy 'Iron' Andrianina", record: "7-2-0", club: "Tiger Gym Tamatave", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
    }
  ],

  schedule: [
    { time: "16:30", event: "Ouverture des portes au public & Accès VIP" },
    { time: "17:30", event: "Première partie : Combats Préliminaires" },
    { time: "19:00", event: "Début de la Main Card & Show d'Ouverture" },
    { time: "21:30", event: "Main Event : Combat pour le Titre Welter" },
  ],

  merchandise: [
    { id: "m1", name: "T-Shirt Officiel MFN Vol.3", price: "35 000 Ar", type: "Vente", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400&auto=format&fit=crop" },
    { id: "m2", name: "Gants de MMA Premium INDESY", price: "25 000 Ar / jour", type: "Location", image: "https://images.unsplash.com/photo-1552667693-8a30343706ba?q=80&w=400&auto=format&fit=crop" }
  ]
};

const ALL_EVENTS = [
  { id: "2", title: "CHAMPIONNAT NATIONAL DE JUDO", discipline: "Judo", date: "12 Août 2026", location: "Gymnase Couvert, Antananarivo", image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=600&auto=format&fit=crop" },
  { id: "3", title: "GALA DES GUERRIERS - ELITE MUAY THAI", discipline: "Muay Thai", date: "05 Septembre 2026", location: "Palais des Sports Mahamasina", image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=600&auto=format&fit=crop" }
];

export default function EventsPage() {
  const [selectedDiscipline, setSelectedDiscipline] = useState("Tous");
  const disciplines = ["Tous", "MMA", "Judo", "Muay Thai"];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* ================= ZONE BANNER AVEC ARRIÈRE-PLAN FIGÉ (BG-FIXED) ================= */}
      <div 
        className="relative w-full min-h-[70vh] bg-cover bg-center bg-no-repeat bg-fixed border-b border-white/10 flex items-center"
        style={{ backgroundImage: `url(${FEATURED_GALA.backgroundImage})` }}
      >
        {/* Voile sombre pour garantir la lisibilité du texte au défilement */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-black/50 to-black/80 z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 py-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 text-slate-950 font-mono text-[10px] uppercase font-black tracking-widest rounded-none">
              <Flame size={12} /> ÉVÉNEMENT MAJEUR
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white font-mono uppercase leading-none">
              {FEATURED_GALA.title}
            </h1>
            <p className="text-amber-400 font-mono text-xs tracking-widest font-bold uppercase">
              {FEATURED_GALA.subtitle}
            </p>
            <p className="text-slate-300 text-sm max-w-2xl font-light leading-relaxed">
              {FEATURED_GALA.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-2 border border-white/5 rounded-none">
                <Calendar size={14} className="text-amber-400" />
                <span>{FEATURED_GALA.date} • {FEATURED_GALA.time}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-2 border border-white/5 rounded-none">
                <MapPin size={14} className="text-amber-400" />
                <span>{FEATURED_GALA.location}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-mono font-black uppercase tracking-wider text-xs rounded-none transition-all hover:opacity-90 flex items-center gap-2">
                Billetterie (Dès {FEATURED_GALA.priceFrom}) <Ticket size={16} />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900/95 border border-amber-500/20 p-6 rounded-none space-y-4 font-mono backdrop-blur-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 border-b border-white/10 pb-2">Infos de Combat</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500">DISCIPLINES</p>
                <p className="font-bold text-slate-200">{FEATURED_GALA.discipline}</p>
              </div>
              <div>
                <p className="text-slate-500">COMBATS</p>
                <p className="font-bold text-slate-200">12 Assrontements</p>
              </div>
            </div>
            <div className="pt-2">
              <div className="w-full bg-slate-950 p-3 border border-white/5 text-[11px] text-slate-400 flex items-start gap-2">
                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <span>Retrait des places physiques disponible au Cyber de la ville à Mahajanga.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ZONE DE CONTENU DÉFILANT ================= */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
        
        {/* PANNEAU PRINCIPAL (GAUCHE) */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* 1. FIGHT CARD */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold font-mono uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <Award size={20} className="text-amber-500" /> Carte des Combats (Fight Card)
            </h2>
            
            <div className="space-y-4">
              {FEATURED_GALA.fightCard.map((fight, index) => (
                <div key={index} className="bg-slate-900/60 backdrop-blur-xs border border-white/5 rounded-none p-4 md:p-6 transition-all hover:border-amber-500/20">
                  <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest">{fight.type}</span>
                    <span className="text-xs text-slate-400 font-mono">{fight.weightClass}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-[42%] text-right justify-end font-mono">
                      <div>
                        <p className="text-xs font-bold text-white">{fight.fighterA.name}</p>
                        <p className="text-[10px] text-slate-500">{fight.fighterA.record} | {fight.fighterA.club}</p>
                      </div>
                      <img src={fight.fighterA.photo} alt="" className="w-10 h-10 object-cover rounded-none border border-white/10 bg-slate-950" />
                    </div>

                    <div className="w-[16%] text-center">
                      <span className="font-mono font-black text-xs text-amber-500 bg-slate-950 border border-white/10 px-2.5 py-1">VS</span>
                    </div>

                    <div className="flex items-center gap-3 w-[42%] text-left justify-start font-mono">
                      <img src={fight.fighterB.photo} alt="" className="w-10 h-10 object-cover rounded-none border border-white/10 bg-slate-950" />
                      <div>
                        <p className="text-xs font-bold text-white">{fight.fighterB.name}</p>
                        <p className="text-[10px] text-slate-500">{fight.fighterB.record} | {fight.fighterB.club}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. PROGRAMME */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold font-mono uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <Clock size={20} className="text-amber-500" /> Horaires de la Journée
            </h2>
            <div className="bg-slate-900/40 backdrop-blur-xs border border-white/5 rounded-none p-6 space-y-4">
              {FEATURED_GALA.schedule.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start font-mono text-xs">
                  <span className="text-amber-400 font-bold bg-slate-950 border border-white/5 px-2 py-0.5 shrink-0">{item.time}</span>
                  <span className="text-slate-300 pt-0.5">{item.event}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. AUTRES ÉVÉNEMENTS */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <h2 className="text-xl font-bold font-mono uppercase tracking-wider flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" /> Calendrier des Galas Nationaux
              </h2>
              <div className="flex gap-1">
                {disciplines.map((disc) => (
                  <button
                    key={disc}
                    onClick={() => setSelectedDiscipline(disc)}
                    className={`px-2.5 py-1 font-mono text-[10px] uppercase border rounded-none transition-all ${
                      selectedDiscipline === disc 
                        ? "bg-amber-500 border-amber-500 text-slate-950 font-bold" 
                        : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {disc}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ALL_EVENTS.map((ev) => (
                <div key={ev.id} className="bg-slate-900/40 backdrop-blur-xs border border-white/5 rounded-none overflow-hidden flex flex-col group hover:border-amber-500/20 transition-all">
                  <div className="relative h-32 bg-slate-950">
                    <img src={ev.image} alt="" className="w-full h-full object-cover opacity-60" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-amber-400 text-[9px] font-mono border border-amber-500/20 rounded-none">{ev.discipline}</span>
                  </div>
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <h4 className="font-mono font-bold text-sm text-white uppercase group-hover:text-amber-400 transition-colors">{ev.title}</h4>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-4">
                      <span>{ev.date}</span>
                      <span className="truncate max-w-[150px]">{ev.location}</span>
                    </div>
                    <button className="w-full py-2 border border-white/5 bg-slate-950 text-xs font-mono text-slate-300 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all rounded-none font-bold flex items-center justify-center gap-1">
                      Réserver <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* PANNEAU LATÉRAL (DROITE) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* BOUTIQUE / RENTALS */}
          <section className="bg-slate-900/60 backdrop-blur-xs border border-white/5 p-6 rounded-none space-y-4">
            <h3 className="text-md font-bold font-mono uppercase tracking-wider text-white border-b border-white/10 pb-2 flex items-center gap-2">
              <ShoppingBag size={16} className="text-amber-500" /> Boutique Officielle du Gala
            </h3>
            
            <div className="space-y-4">
              {FEATURED_GALA.merchandise.map((item) => (
                <div key={item.id} className="flex gap-3 bg-slate-950 p-2.5 border border-white/5 rounded-none">
                  <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-none bg-slate-900 border border-white/5" />
                  <div className="flex flex-col justify-between flex-1 font-mono text-xs">
                    <div>
                      <h4 className="font-bold text-slate-200 line-clamp-1">{item.name}</h4>
                      <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 mt-0.5 ${
                        item.type === "Location" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-slate-400">{item.price}</span>
                      <button className="text-[10px] text-amber-400 hover:text-white transition-colors underline">Ajouter</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SÉCURITÉ */}
          <section className="bg-slate-900/40 backdrop-blur-xs border border-red-500/10 p-6 rounded-none space-y-2 font-mono text-xs">
            <h3 className="font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <AlertTriangle size={14} /> Directives
            </h3>
            <ul className="text-[11px] text-slate-400 space-y-1.5 list-inside list-disc">
              <li>Objets en verre strictement interdits.</li>
              <li>Fouille de sécurité à l'entrée.</li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
              <HelpCircle size={16} className="text-amber-500" /> FAQ
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-slate-900/60 backdrop-blur-xs border border-white/5 rounded-none">
                <p className="font-bold text-slate-200 mb-1">Où récupérer les articles loués ?</p>
                <p className="text-[11px] text-slate-400">Directement au guichet boutique d'Ampisikina le jour J.</p>
              </div>
            </div>
          </section>
          
        </div>

      </div>

    </div>
  );
}