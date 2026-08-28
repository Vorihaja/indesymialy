"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarRange, CircleDot, Radio, ShoppingBag, Swords, UsersRound } from "lucide-react";

const PULSE = ["Fight Live", "Talents malagasy", "Événements nationaux", "Clubs & académies", "Marketplace", "Classements officiels"];
const PATHS = [
  { number: "01", icon: Swords, title: "Suivre l’action", text: "Fight cards, résultats, temps forts et expérience live au même endroit.", href: "/live", label: "Ouvrir le Live Center" },
  { number: "02", icon: UsersRound, title: "Découvrir les talents", text: "Des trajectoires, des records et des profils qui racontent le combat malagasy.", href: "/fighters", label: "Explorer les profils" },
  { number: "03", icon: CalendarRange, title: "Vibrer ensemble", text: "Trouvez les prochains rendez-vous et prenez place au plus près de l’arène.", href: "/events", label: "Voir les événements" },
  { number: "04", icon: ShoppingBag, title: "Équiper l’ambition", text: "Produits, services et expertises conçus pour faire progresser tout l’écosystème.", href: "/marketplace", label: "Visiter la Marketplace" },
];

export function HomePulseRibbon() {
  return (
    <div className="home-pulse-ribbon" aria-label="Les univers Indesy Mialy">
      <div className="home-pulse-label"><Radio size={15} /> Maintenant</div>
      <div className="home-pulse-track"><div className="home-pulse-content">
        {[...PULSE, ...PULSE].map((item, index) => <span key={`${item}-${index}`}><CircleDot size={11} />{item}</span>)}
      </div></div>
    </div>
  );
}

export function HomeMotionStory() {
  const reduced = useReducedMotion();
  return (
    <section className="home-story" aria-labelledby="home-story-title">
      <div className="home-story-aura" aria-hidden="true" />
      <motion.header className="home-story-header" initial={{ opacity: 0, y: reduced ? 0 : 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: reduced ? 0 : 0.7 }}>
        <div><span className="home-story-eyebrow">Une plateforme. Toutes les émotions.</span><h2 id="home-story-title">Choisissez votre façon de vivre <em>l’expérience.</em></h2></div>
        <p>Entrez par l’action, les talents, les rendez-vous ou les opportunités. Chaque chemin rejoint le même mouvement.</p>
      </motion.header>
      <div className="home-story-paths">
        {PATHS.map((path, index) => {
          const Icon = path.icon;
          return (
            <motion.article key={path.number} initial={{ opacity: 0, y: reduced ? 0 : 42 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : index * 0.08 }}>
              <span className="home-story-number">{path.number}</span><span className="home-story-icon"><Icon /></span>
              <h3>{path.title}</h3><p>{path.text}</p>
              <Link href={path.href}>{path.label}<ArrowUpRight size={17} /></Link>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
