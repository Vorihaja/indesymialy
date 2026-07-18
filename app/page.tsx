"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Flame, Trophy, Users, ShoppingBag, ShieldAlert, 
  ArrowUpRight, Calendar, MapPin, Award, Star, 
  TrendingUp, Activity, Zap, ShieldCheck, ChevronLeft, ChevronRight
} from "lucide-react";

// 1. Configuration des 5 Slides différents avec leurs CTA personnalisés
const HERO_SLIDES = [
  {
    tag: "GALA EXCLUSIF BOENY",
    title: "MAHAJANGA FIGHT NIGHT VOL.3",
    description: "Le plus grand événement de MMA et de Kickboxing de la province débarque au Complexe d'Ampisikina. Les ceintures nationales sont en jeu.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1400&auto=format&fit=crop",
    cta: [
      { label: "Réserver vos places", href: "/events", primary: true },
      { label: "Voir la Fight Card", href: "/events", primary: false }
    ]
  },
  {
    tag: "ÉQUIPEMENTS & SÉCURITÉ",
    title: "MARKETPLACE CENTRALISÉE",
    description: "Achetez ou louez votre matériel de combat certifié : gants, plastrons, protections et kimonos. Retrait rapide ou livraison locale.",
    image: "https://images.unsplash.com/photo-1552667693-8a30343706ba?q=80&w=1400&auto=format&fit=crop",
    cta: [
      { label: "Louer du matériel", href: "/marketplace", primary: true },
      { label: "Boutique Vente", href: "/marketplace", primary: false }
    ]
  },
  {
    tag: "ATHLÈTES DE MADAGASCAR",
    title: "PROFIL ET CARRIÈRE PRO",
    description: "Suivez l'évolution des meilleurs combattants malagasy, consultez leurs records officiels, leurs clubs d'origine et leurs prochains chocs.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1400&auto=format&fit=crop",
    cta: [
      { label: "Découvrir les Combattants", href: "/combattants", primary: true }
    ]
  },
  {
    tag: "REJOINDRE L'ÉLITE",
    title: "ESPACE ORGANISATEURS & CLUBS",
    description: "Planifiez vos galas, gérez vos inscriptions d'athlètes et utilisez nos outils d'arbitrage transparents pour professionnaliser vos événements.",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201",
    cta: [
      { label: "Affilier votre Club", href: "/organisateur", primary: true },
      { label: "Devenir Partenaire", href: "/sponsor", primary: false }
    ]
  },
  {
    tag: "TRANSPARENCE FÉDÉRALE",
    title: "RÈGLEMENTS & ARBITRAGE",
    description: "Découvrez les normes et les chartes éthiques d'INDESY MIALY visant à garantir l'intégrité physique et le respect des disciplines de combat.",
    image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1400&auto=format&fit=crop",
    cta: [
      { label: "Consulter la Charte", href: "#charte", primary: true }
    ]
  }
];

const STATS = [
  { label: "Combattants Enregistrés", value: "340+", icon: Users },
  { label: "Galas cette saison", value: "18", icon: Trophy },
  { label: "Disciplines Gérées", value: "6", icon: Activity },
  { label: "Clubs Partenaires", value: "45", icon: ShieldCheck },
];

const UPCOMING_GALAS = [
  {
    id: "mfn-3",
    title: "MAHAJANGA FIGHT NIGHT - VOL.3",
    discipline: "MMA / KICKBOXING",
    date: "28 Juillet 2026",
    location: "Complexe Sportif Ampisikina, Mahajanga",
    badge: "ÉVÉNEMENT MAJEUR",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "judo-nat-2026",
    title: "CHAMPIONNAT NATIONAL DE JUDO",
    discipline: "JUDO",
    date: "12 Août 2026",
    location: "Gymnase Couvert, Antananarivo",
    badge: "OFFICIEL FMNJ",
    image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "muay-thai-elite",
    title: "GALA DES GUERRIERS - MUAY THAI",
    discipline: "MUAY THAI",
    date: "05 Septembre 2026",
    location: "Palais des Sports, Mahamasina",
    badge: "CHOC DES TITANS",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201"
  }
];

const TOP_FIGHTERS = [
  { name: "Rova Rakotonirina", discipline: "MMA", rank: "#1 Welterweight", record: "12-2-0", status: "Champion MFN", photo: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/combattant_1" },
  { name: "Jean Razafindrakoto", discipline: "MMA", rank: "#2 Welterweight", record: "10-1-0", status: "Challenger N°1", photo: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/combattant_2" },
  { name: "Aina Ramanantsoa", discipline: "Judo", rank: "-73kg National", record: "24-3-0", status: "Médaillé d'Or", photo: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/combattant_3" },
];

const MARKETPLACE_HIGHLIGHTS = [
  { name: "Gants de Boxe Premium INDESY", price: "85 000 Ar", type: "Vente", image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201" },
  { name: "Plastron de Protection Taekwondo", price: "8 000 Ar / jour", type: "Location", image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201" },
  { name: "Pao de Frappe Professionnel (Paire)", price: "120 000 Ar", type: "Vente", image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201" },
];

const LATEST_NEWS = [
  { title: "Nouveau règlement MMA validé pour la saison 2026", date: "Il y a 2 jours", category: "Fédéral" },
  { title: "Ouverture des inscriptions pour les juges et arbitres nationaux", date: "Il y a 5 jours", category: "Formation" },
  { title: "Infrastructures : Rénovation du dojo provincial à Mahajanga", date: "Il y a 1 semaine", category: "Infrastructure" }
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const SLIDE_DURATION = 6000; // Durée de 6 secondes par slide

  // Logique du défilement automatique avec barre de progression
  useEffect(() => {
    setProgress(0);
    const intervalTime = 100;
    const steps = SLIDE_DURATION / intervalTime;
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((prevSlide) => (prevSlide + 1) % HERO_SLIDES.length);
          return 0;
        }
        return prev + (100 / steps);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans antialiased selection:bg-red-600 selection:text-white">
      
      {/* ================= HERO SECTION MULTI-SLIDES DYNAMIQUE ================= */}
      <section className="relative w-full border-b border-neutral-800 bg-neutral-950 min-h-[75vh] lg:min-h-[80vh] flex items-center overflow-hidden">
        
        {/* Images en arrière-plan avec transitions fluides */}
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? "opacity-30 z-0" : "opacity-0 z-0"
            }`}
          >
            <img src={slide.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
          </div>
        ))}
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.02),transparent_50%)]" />
        
        {/* Contenu principal */}
        <div className="relative z-10 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-[10px] uppercase font-black tracking-widest rounded-none">
              <Zap size={12} className="text-red-500 animate-pulse" /> {HERO_SLIDES[currentSlide].tag}
            </span>
            
            {/* Conteneur à hauteur fixe minimale pour éviter les sauts de mise en page */}
            <div className="min-h-[160px] md:min-h-[180px] flex flex-col justify-center">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-mono text-white leading-none transition-all duration-500">
                {HERO_SLIDES[currentSlide].title}
              </h1>
              <p className="text-neutral-400 text-sm md:text-base max-w-2xl font-light leading-relaxed mt-4 transition-all duration-500">
                {HERO_SLIDES[currentSlide].description}
              </p>
            </div>

            {/* CTAs adaptés de manière dynamique selon le slide en cours */}
            <div className="flex flex-wrap items-center gap-4 pt-4 min-h-[60px]">
              {HERO_SLIDES[currentSlide].cta.map((button, bIdx) => (
                <Link
                  key={bIdx}
                  href={button.href}
                  className={`px-6 py-3.5 font-mono text-xs font-black uppercase tracking-wider rounded-none transition-all ${
                    button.primary
                      ? "bg-red-600 text-white hover:bg-red-400 hover:opacity-90"
                      : "bg-transparent border border-red-600/40 text-red-500 hover:bg-red-400 hover:text-white hover:border-red-400"
                  }`}
                >
                  {button.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Panneau de Statistiques Fixe à Droite */}
          <div className="lg:col-span-5 bg-neutral-900 border border-red-500/20 p-6 md:p-8 rounded-none space-y-6 shadow-2xl z-20">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 font-mono">
              <h3 className="text-sm font-black text-red-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} /> Suivi de la Saison
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-400 border border-neutral-700 rounded-none">LIVE</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-black/40 border border-neutral-800 p-4 rounded-none space-y-2">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider">{stat.label}</span>
                      <Icon size={14} className="text-red-500" />
                    </div>
                    <p className="text-2xl font-black font-mono text-white tracking-tight">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CONTRÔLES DU CARROUSEL ET BARRES DE CHARGEMENT */}
        <div className="absolute inset-x-0 bottom-0 z-30 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Flèches de navigation manuelles */}
          <div className="flex items-center gap-1.5 order-2 sm:order-1">
            <button onClick={prevSlide} className="p-2 border border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:text-red-400 hover:border-red-500/30 rounded-none transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextSlide} className="p-2 border border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:text-red-400 hover:border-red-500/30 rounded-none transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Barres de progression individuelles pour chaque slide */}
          <div className="grid grid-cols-5 gap-2 w-full sm:max-w-md order-1 sm:order-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setCurrentSlide(idx); setProgress(0); }}
                className="group flex flex-col space-y-1.5 focus:outline-none text-left"
              >
                <div className="h-[3px] w-full bg-neutral-800 rounded-none overflow-hidden relative">
                  <div
                    className="h-full bg-red-600 absolute left-0 top-0 transition-all duration-100"
                    style={{
                      width: idx === currentSlide ? `${progress}%` : idx < currentSlide ? "100%" : "0%"
                    }}
                  />
                </div>
                <span className={`font-mono text-[9px] font-bold tracking-wider transition-colors ${
                  idx === currentSlide ? "text-red-500" : "text-neutral-600 group-hover:text-neutral-400"
                }`}>
                  0{idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>

      </section>

      {/* ================= CONTENU GÉNÉRAL ================= */}
      <main className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNE GAUCHE (8 COLONNES) */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* SECTION PROCHAINS GALAS */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                <Calendar size={20} className="text-red-500" /> Prochains Galas Majeurs
              </h2>
              <Link href="/events" className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                Tout voir <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {UPCOMING_GALAS.map((gala) => (
                <div key={gala.id} className="bg-neutral-900 border border-neutral-800 hover:border-blue-500/40 transition-all rounded-none overflow-hidden flex flex-col group">
                  <div className="relative h-40 bg-neutral-950">
                    <img src={gala.image} alt={gala.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/90 text-red-500 text-[9px] font-mono font-bold border border-red-500/30 rounded-none tracking-widest">{gala.badge}</span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-400 tracking-wider block mb-1">{gala.discipline}</span>
                      <h4 className="font-mono font-bold text-sm text-white uppercase tracking-tight line-clamp-2">{gala.title}</h4>
                    </div>
                    <div className="space-y-1 text-[11px] font-mono text-neutral-400 border-t border-neutral-800/60 pt-2">
                      <div className="flex items-center gap-1.5 truncate"><MapPin size={12} className="text-neutral-600 shrink-0" /> <span className="truncate">{gala.location}</span></div>
                      <div className="flex items-center gap-1.5"><Calendar size={12} className="text-neutral-600 shrink-0" /> <span>{gala.date}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION ATHLÈTES EN VEDETTE */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                <Award size={20} className="text-red-500" /> Classement & Athlètes Vedettes
              </h2>
              <Link href="/combattants" className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                Tous les combattants <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TOP_FIGHTERS.map((fighter, idx) => (
                <div key={idx} className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-none flex items-center gap-4 transition-all hover:border-blue-500/40">
                  <img src={fighter.photo} alt={fighter.name} className="w-14 h-14 object-cover border border-neutral-800 bg-neutral-950 rounded-none grayscale hover:grayscale-0 transition-all" />
                  <div className="font-mono text-xs space-y-0.5 min-w-0">
                    <p className="font-bold text-white truncate">{fighter.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-blue-400 font-bold">{fighter.discipline}</span>
                      <span className="text-red-500">|</span>
                      <span className="text-neutral-400 truncate">{fighter.rank}</span>
                    </div>
                    <p className="text-[10px] text-neutral-500">Fiche: <span className="text-neutral-300">{fighter.record}</span></p>
                    <span className="inline-block text-[9px] font-black bg-red-500/10 text-red-500 px-1 border border-red-500/20 uppercase tracking-widest mt-1">{fighter.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION LA MARKETPLACE */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                <ShoppingBag size={20} className="text-red-500" /> Boutique Équipements & Locations
              </h2>
              <Link href="/marketplace" className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                Accéder au marché <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MARKETPLACE_HIGHLIGHTS.map((item, idx) => (
                <div key={idx} className="bg-neutral-900 border border-neutral-800 p-3 rounded-none flex flex-col justify-between group">
                  <div className="relative h-32 bg-neutral-950 overflow-hidden mb-3 border border-neutral-800">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-70 group-hover:scale-102 transition-transform duration-300" />
                    <span className={`absolute bottom-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border ${
                      item.type === "Location" 
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {item.type}
                    </span>
                  </div>
                  <div className="font-mono text-xs space-y-2">
                    <h4 className="font-bold text-neutral-200 line-clamp-1 group-hover:text-red-400 transition-colors">{item.name}</h4>
                    <div className="flex items-center justify-between border-t border-neutral-800/80 pt-2">
                      <span className="font-bold text-white text-sm">{item.price}</span>
                      <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline">Consulter</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* COLONNE DROITE (4 COLONNES) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* PANNEAU D'INFORMATIONS ET ACTUS */}
          <section className="bg-neutral-900 border border-neutral-800 p-6 rounded-none space-y-4">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white border-b border-neutral-800 pb-2 flex items-center gap-2">
              <Flame size={16} className="text-red-500" /> Actualités & Décisions Fédérales
            </h3>
            
            <div className="space-y-4">
              {LATEST_NEWS.map((news, idx) => (
                <div key={idx} className="space-y-1 font-mono group cursor-pointer">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-red-500 font-bold uppercase tracking-wider">{news.category}</span>
                    <span className="text-red-500">{news.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-300 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                    {news.title}
                  </h4>
                  <hr className="border-neutral-800/60 pt-1" />
                </div>
              ))}
            </div>
          </section>

          {/* CODE ETHIQUE / CHARTE */}
          <section id="charte" className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-none space-y-3 font-mono text-xs scroll-mt-24">
            <h3 className="font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-red-500" /> Charte de la Plateforme
            </h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Toutes les compétitions affichées sur INDESY MIALY respectent scrupuleusement les réglementations nationales et internationales en vigueur pour la sécurité et la santé intégrale des combattants.
            </p>
          </section>

          {/* INSCRIPTION CLUBS */}
          <section className="bg-gradient-to-br from-neutral-900 to-black border border-red-500/20 p-6 rounded-none space-y-4 font-mono">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">Organisateurs & Clubs</h4>
              <p className="text-sm font-black text-white uppercase">Affiliez votre structure</p>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Bénéficiez de nos outils de billetterie centralisée, de la gestion automatique des poules et de notre visibilité médiatique nationale.
            </p>
            <button className="w-full py-2.5 border border-red-500/30 bg-red-500/5 text-xs text-red-500 font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all rounded-none">
              Soumettre une demande
            </button>
          </section>

        </div>

      </main>
    </div>
  );
}
