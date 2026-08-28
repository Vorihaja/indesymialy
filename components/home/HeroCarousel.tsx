"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, MapPin, Radio, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SLIDES = [
  {
    eyebrow: "L’arène malagasy s’éveille", title: "Vivez chaque combat.", accent: "Écrivez l’histoire.",
    description: "Événements, athlètes, clubs et émotions : toute la scène des sports de combat de Madagascar réunie dans une expérience unique.",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/combattant_1",
    primary: ["Entrer dans l’arène", "/events"], secondary: ["Voir les combattants", "/fighters"],
    meta: ["Mahajanga Fight Night", "30 août 2026", "Stade Rabemananjara"],
  },
  {
    eyebrow: "Une nation, mille trajectoires", title: "Votre talent mérite", accent: "une scène.",
    description: "Créez votre identité sportive, développez votre réseau et faites rayonner votre parcours au cœur de l’écosystème national.",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/banniere_Indesy_Mialy",
    primary: ["Explorer les talents", "/fighters"], secondary: ["Voir les classements", "/rankings"],
    meta: ["Athlètes vérifiés", "Toutes disciplines", "Couverture nationale"],
  },
  {
    eyebrow: "L’écosystème passe au niveau supérieur", title: "Pilotez. Connectez.", accent: "Accélérez.",
    description: "Des outils professionnels pour gérer chaque carrière, structure, événement et opportunité sans perdre l’énergie du sport.",
    image: "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201",
    primary: ["Rejoindre Indesy Mialy", "/auth/register"], secondary: ["Découvrir l’écosystème", "/annuaire"],
    meta: ["13 ERP spécialisés", "Opérations en temps réel", "Toute la communauté"],
  },
] as const;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const reduced = useReducedMotion();
  const slide = SLIDES[active];
  const move = (step: number) => { setActive((value) => (value + step + SLIDES.length) % SLIDES.length); setProgress(0); };

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => setProgress((value) => {
      if (value >= 99) { setActive((item) => (item + 1) % SLIDES.length); return 0; }
      return value + 1;
    }), 70);
    return () => window.clearInterval(timer);
  }, [reduced]);

  return (
    <section className="home-cinematic" aria-roledescription="carousel" aria-label="À la une Indesy Mialy">
      <AnimatePresence mode="sync">
        <motion.div key={slide.image} className="home-cinematic-image" style={{ backgroundImage: `url("${slide.image}")` }}
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
        <div className="home-cinematic-pagination">{SLIDES.map((item, index) => <button key={item.title} onClick={() => { setActive(index); setProgress(0); }} className={index === active ? "is-active" : ""} aria-label={`Afficher la scène ${index + 1}`}><span>0{index + 1}</span><i><b style={{ width: index === active ? `${reduced ? 100 : progress}%` : 0 }} /></i></button>)}</div>
        <a href="#arena-control" className="home-cinematic-scroll">Explorer<span><ArrowDownRight size={16} /></span></a>
      </div>
    </section>
  );
}
