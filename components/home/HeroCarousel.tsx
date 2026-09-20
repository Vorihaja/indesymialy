"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, MapPin, Radio, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SLIDES = [
  {
    navLabel: "Indesy",
    eyebrow: "La plateforme de toute la filière combat",
    title: "INDESY MIALY.",
    accent: "TOUT LE SECTEUR, ENSEMBLE.",
    description: "Indesy Mialy relie pratiquants, clubs, coachs, organisateurs, officiels, instances, partenaires et supporters autour des carrières, des compétitions et de données fiables.",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo_sans_fond",
    primary: ["Accueil", "/"],
    secondary: ["Créer un compte", "/auth/register"],
    meta: ["Tous les acteurs", "Données & opportunités", "Madagascar"],
  },
  {
    navLabel: "ERP",
    eyebrow: "Les outils de gestion de la filière",
    title: "INDESY ERP.",
    accent: "STRUCTUREZ. PILOTEZ. PERFORMEZ.",
    description: "Des espaces métier pour administrer licences, membres, entraînements, événements, affectations, contrats, finances et performances, du club jusqu’aux instances nationales.",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo_sans_fond",
    primary: ["Découvrir les espaces", "/auth/register"],
    secondary: ["Créer un compte", "/auth/register"],
    meta: ["Acteurs & structures", "Opérations centralisées", "Suivi en temps réel"],
  },
  {
    navLabel: "Marketplace",
    eyebrow: "Le marché spécialisé des sports de combat",
    title: "INDESY MARKETPLACE.",
    accent: "ÉQUIPEZ. VENDEZ. DÉVELOPPEZ.",
    description: "Une place de marché pour acheter, vendre ou louer équipements et services, découvrir les offres des professionnels et gérer commandes, stocks, paiements et livraisons.",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo_sans_fond",
    primary: ["Marketplace", "/marketplace"],
    secondary: ["Créer un compte", "/auth/register"],
    meta: ["Produits & services", "Achat · Vente · Location", "Vendeurs spécialisés"],
  },
  {
    navLabel: "Korana",
    eyebrow: "La voix sociale de la communauté combat",
    title: "INDESY KORANA.",
    accent: "RACONTEZ. ÉCHANGEZ. RAYONNEZ.",
    description: "Le réseau où athlètes, clubs, médias et passionnés publient leurs actualités, partagent leurs parcours, débattent et font vivre la communauté avant, pendant et après les combats.",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo_sans_fond",
    primary: ["Découvrir Korana", "/korana"],
    secondary: ["Créer un compte", "/auth/register"],
    meta: ["Actualités & médias", "Discussions & messages", "Communauté nationale"],
  },
] as const;

const AUTO_ADVANCE_MS = 7_000;
const PROGRESS_TICK_MS = 70;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const elapsedMs = useRef(0);
  const reduced = useReducedMotion();
  const slide = SLIDES[active];
  const restartCycle = () => {
    elapsedMs.current = 0;
    setProgress(0);
  };
  const move = (step: number) => {
    setActive((value) => (value + step + SLIDES.length) % SLIDES.length);
    restartCycle();
  };
  const selectSlide = (index: number) => {
    setActive(index);
    restartCycle();
  };

  useEffect(() => {
    if (reduced) return;
    elapsedMs.current = 0;
    const timer = window.setInterval(() => {
      elapsedMs.current += PROGRESS_TICK_MS;

      if (elapsedMs.current >= AUTO_ADVANCE_MS) {
        elapsedMs.current = 0;
        setActive((item) => (item + 1) % SLIDES.length);
        setProgress(0);
        return;
      }

      setProgress((elapsedMs.current / AUTO_ADVANCE_MS) * 100);
    }, PROGRESS_TICK_MS);
    return () => window.clearInterval(timer);
  }, [reduced]);

  return (
    <section className="home-cinematic" aria-roledescription="carousel" aria-label="À la une Indesy Mialy">
      <AnimatePresence mode="sync">
        <motion.div key={active} className="home-cinematic-image" style={{ backgroundImage: `url("${slide.image}")` }}
          initial={{ opacity: 0, scale: reduced ? 1 : 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }} aria-hidden="true" />
      </AnimatePresence>
      <div className="home-cinematic-shade" aria-hidden="true" /><div className="home-cinematic-grid" aria-hidden="true" />
      <div className="home-cinematic-orbit orbit-one" aria-hidden="true" /><div className="home-cinematic-orbit orbit-two" aria-hidden="true" />
      <div className="home-cinematic-content">
        <div className="home-cinematic-side-label" aria-hidden="true"><span>Indesy Mialy</span><i /><span>Combat sports platform</span></div>
        <AnimatePresence mode="wait">
          <motion.div key={active} className="home-cinematic-copy" initial={{ opacity: 0, y: reduced ? 0 : 34 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: reduced ? 0 : 0.7 }}>
            <div className="home-cinematic-kicker"><span className="home-live-dot" />{slide.eyebrow}</div>
            <h1 className="home-cinematic-title">{slide.title}<span>{slide.accent}</span></h1>
            <p className="home-cinematic-lead">{slide.description}</p>
            <div className="home-cinematic-actions">
              <Link href={slide.primary[1]} className="home-cinematic-primary">{slide.primary[0]}<ArrowRight size={18} /></Link>
              <Link href={slide.secondary[1]} className="home-cinematic-secondary">{slide.secondary[0]}<ArrowDownRight size={18} /></Link>
            </div>
          </motion.div>
        </AnimatePresence>
        <motion.aside className="home-cinematic-signal" initial={{ opacity: 0, x: reduced ? 0 : 30 }} animate={{ opacity: 1, x: 0 }}>
          <header><span><Radio size={15} /> Signal en direct</span><strong>0{active + 1}</strong></header>
          <div className="home-cinematic-meta">
            {[CalendarDays, Radio, MapPin].map((Icon, index) => <div key={slide.meta[index]}><span><Icon size={15} /></span><p>{["À la une", "Statut", "Repère"][index]}<strong>{slide.meta[index]}</strong></p></div>)}
          </div>
          <footer><ShieldCheck size={16} />Données officielles Indesy Mialy</footer>
        </motion.aside>
      </div>
      <div className="home-cinematic-controls">
        <div className="home-cinematic-arrows"><button onClick={() => move(-1)} aria-label="Scène précédente"><ChevronLeft /></button><button onClick={() => move(1)} aria-label="Scène suivante"><ChevronRight /></button></div>
        <div className="home-cinematic-pagination">{SLIDES.map((item, index) => <button type="button" key={item.title} onClick={() => selectSlide(index)} className={index === active ? "is-active" : ""} aria-label={`Afficher la scène ${index + 1} : ${item.navLabel}`}><span>0{index + 1} · {item.navLabel}</span><i><b style={{ width: index === active ? `${reduced ? 100 : progress}%` : 0 }} /></i></button>)}</div>
        <a href="#arena-control" className="home-cinematic-scroll">Explorer<span><ArrowDownRight size={16} /></span></a>
      </div>
    </section>
  );
}
