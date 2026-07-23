"use client"

import React, { useState, useRef, useEffect, MouseEvent } from "react"
import { motion, useMotionValue, useSpring, useTransform, animate, Variants } from "framer-motion"
import { Shield, Target, Zap, Trophy, Users, Calendar, Swords } from "lucide-react"
import { supabase } from "@/lib/supabase"

// ==========================================
// COMPOSANT : COMPTEUR NUMÉRIQUE ANIMÉ
// ==========================================
function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: "easeOut",
    })
    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v))
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, count, rounded])

  return <span>{displayValue}</span>
}

// ==========================================
// COMPOSANT : SUIVI DE LA SAISON (SUPABASE)
// ==========================================
interface StatItem {
  label: string
  value: number
  icon: React.ReactNode
  suffix: string
}

function SeasonStats() {
  const [stats, setStats] = useState({
    totalFighters: 0,
    upcomingEvents: 0,
    activeClubs: 0,
    totalBouts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRealSeasonData() {
      try {
        setLoading(true)

        // 1. Total athlètes / profils
        const { count: fightersCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })

        // 2. Événements futurs ou actuels
        const { count: eventsCount } = await supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .gte("event_date", new Date().toISOString())

        // 3. Clubs ou Organisations
        const { count: clubsCount } = await supabase
          .from("clubs")
          .select("id", { count: "exact", head: true })

        // 4. Total des combats enregistrés
        const { count: boutsCount } = await supabase
          .from("bouts")
          .select("id", { count: "exact", head: true })

        setStats({
          totalFighters: fightersCount || 0,
          upcomingEvents: eventsCount || 0,
          activeClubs: clubsCount || 0,
          totalBouts: boutsCount || 0,
        })
      } catch (err) {
        console.error("Erreur de chargement des compteurs live :", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRealSeasonData()
  }, [])

  const items: StatItem[] = [
    { label: "Athlètes Inscrits", value: stats.totalFighters, icon: <Users className="h-5 w-5" />, suffix: "" },
    { label: "Événements Live", value: stats.upcomingEvents, icon: <Calendar className="h-5 w-5" />, suffix: "" },
    { label: "Clubs Partenaires", value: stats.activeClubs, icon: <Shield className="h-5 w-5" />, suffix: "" },
    { label: "Combats Enregistrés", value: stats.totalBouts, icon: <Swords className="h-5 w-5" />, suffix: "+" },
  ]

  return (
    <div className="w-full rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
          Suivi en Direct de la Saison
        </h3>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 text-left">
            <div className="mb-2 text-amber-500">{item.icon}</div>
            <div className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {loading ? (
                <span className="inline-block h-7 w-12 animate-pulse rounded bg-zinc-800" />
              ) : (
                <>
                  <AnimatedCounter value={item.value} />
                  <span className="text-amber-500 ml-0.5">{item.suffix}</span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs font-medium text-zinc-400 truncate">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// COMPOSANT : LA CARTE 3D HOLOGRAPHIQUE
// ==========================================
interface CardProps {
  title: string
  description: string
  icon: React.ReactNode
  tag: string
}

function DisciplineCard({ title, description, icon, tag }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"])

  const glowX = useMotionValue(0)
  const glowY = useMotionValue(0)
  const glowXSpring = useSpring(glowX, { stiffness: 250, damping: 25 })
  const glowYSpring = useSpring(glowY, { stiffness: 250, damping: 25 })

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const relativeX = (e.clientX - rect.left) / width - 0.5
    const relativeY = (e.clientY - rect.top) / height - 0.5

    x.set(relativeX)
    y.set(relativeY)

    glowX.set(e.clientX - rect.left)
    glowY.set(e.clientY - rect.top)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="group relative cursor-pointer rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 transition-colors duration-500 hover:border-amber-500/50"
    >
      <motion.div
        style={{ left: glowXSpring, top: glowYSpring }}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-48 h-48 bg-amber-500/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />

      <div style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-amber-500 group-hover:border-amber-500/30 group-hover:bg-amber-500/5 transition-all duration-500">
            {icon}
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500 group-hover:text-amber-400 transition-colors duration-300">
            {tag}
          </span>
        </div>

        <h3 className="text-xl font-bold text-zinc-100 tracking-tight group-hover:text-white">
          {title}
        </h3>
        
        <p className="text-sm leading-relaxed text-zinc-400 group-hover:text-zinc-300">
          {description}
        </p>

        <div className="pt-2">
          <div className="h-[1px] w-full bg-zinc-800 group-hover:bg-gradient-to-r group-hover:from-amber-500/50 group-hover:to-transparent transition-all duration-500" />
        </div>
      </div>
    </motion.div>
  )
}

// ==========================================
// COMPOSANT PRINCIPAL : HERO + SECTIONS
// ==========================================
export default function HeroAndFeatures() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { ease: "easeInOut", duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased overflow-hidden selection:bg-amber-500/30">
      
      {/* DESIGN DE FOND : LUEURS AMBIANTES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[140px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-amber-600/5 blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* SECTION HERO */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-32 pb-16 text-center max-w-5xl mx-auto z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-4 py-1.5 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-widest text-amber-400">
              L&apos;Écosystème des Sports de Combat
            </span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"
          >
            INDESY MIALY
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="max-w-2xl mx-auto text-lg text-zinc-400 sm:text-xl font-light leading-relaxed"
          >
            Dominez l&apos;arène. Gérez vos athlètes, organisez vos événements mondiaux et propulsez votre discipline dans une nouvelle dimension numérique.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button className="group relative w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all duration-300">
              Découvrir la Plateforme
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm text-zinc-300 hover:border-zinc-700 hover:text-white transition-all duration-300">
              Rejoindre l&apos;Arène
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION DU BLOC DE STATISTIQUES LIVE */}
      <section className="relative max-w-5xl mx-auto px-4 pb-20 z-10">
        <SeasonStats />
      </section>

      {/* SECTION GRILLE DE FEATURES 3D */}
      <section className="relative max-w-6xl mx-auto px-4 pb-32 z-10">
        <div className="mb-12 text-center sm:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-400 uppercase sm:text-sm sm:tracking-widest sm:text-amber-500">
            Fonctionnalités Maîtresses
          </h2>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Taillé pour la performance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 perspective-[1000px]">
          <DisciplineCard
            title="Profils d'Athlètes"
            description="Suivi complet des statistiques, des palmarès, des catégories de poids et des contrats en temps réel."
            icon={<Shield className="h-6 w-6" />}
            tag="Management"
          />
          <DisciplineCard
            title="Gestion d'Événements"
            description="Création de fight-cards interactives, billetterie intégrée et gestion automatisée des arbres de tournois."
            icon={<Target className="h-6 w-6" />}
            tag="Organisation"
          />
          <DisciplineCard
            title="Dashboard ERP"
            description="Pilotez votre fédération ou votre club avec des outils de comptabilité et de CRM de très haut niveau."
            icon={<Zap className="h-6 w-6" />}
            tag="Business"
          />
          <DisciplineCard
            title="Marketplace Elite"
            description="Boutique exclusive pour équipements certifiés, merchandising officiel et services d'entraînement premium."
            icon={<Trophy className="h-6 w-6" />}
            tag="Commerce"
          />
        </div>
      </section>
    </div>
  )
}