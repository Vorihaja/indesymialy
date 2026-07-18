"use client"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Calendar, MapPin, Grid3x3, List } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function getEventStatus(dateStr: string) {
  if (!dateStr) return { status: "NORMAL" as const, diffDays: 999 }
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const eventTime = new Date(dateStr).getTime()
  const diffDays = Math.ceil((eventTime - startOfToday) / (1000*60*60*24))
  const isSameDay = new Date(dateStr).toDateString() === now.toDateString()
  if (isSameDay) return { status: "LIVE" as const, diffDays: 0 }
  if (diffDays >= 1 && diffDays <= 3) return { status: "J-3" as const, diffDays }
  if (diffDays < 0) return { status: "PASSÉ" as const, diffDays }
  return { status: "NORMAL" as const, diffDays }
}

const FALLBACK = [
  {
    id: "evt-live",
    name: "MAHAJANGA FIGHT NIGHT - VOL.3",
    date: new Date().toISOString(),
    location: "Complexe Sportif Ampisikina, Mahajanga",
    disciplines: { name: "MMA" },
    badge: "ÉVÉNEMENT MAJEUR",
    image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "evt-j1",
    name: "OPEN ANTSIRABE - KICKBOXING ELITE",
    date: new Date(Date.now() + 1*24*3600*1000).toISOString(),
    location: "Gymnase Vatofotsy, Antsirabe",
    disciplines: { name: "Kickboxing" },
    badge: "CHOC",
    image_url: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "evt-j2",
    name: "GALA DES GUERRIERS - MUAY THAI",
    date: new Date(Date.now() + 2*24*3600*1000).toISOString(),
    location: "Palais des Sports Mahamasina",
    disciplines: { name: "Muay Thai" },
    badge: "TITRE NATIONAL",
    image_url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "evt-j3",
    name: "CHAMPIONNAT NATIONAL DE JUDO",
    date: new Date(Date.now() + 3*24*3600*1000).toISOString(),
    location: "Gymnase Couvert, Antananarivo",
    disciplines: { name: "Judo" },
    badge: "OFFICIEL FMNJ",
    image_url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=600&auto=format&fit=crop"
  },
]

export default function EventsPage() {
  const [view, setView] = useState<"cards" | "list">("cards")
  const [filterDiscipline, setFilterDiscipline] = useState("Tous")
  const [events, setEvents] = useState<any[]>([])
  const [allDisciplines, setAllDisciplines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // 1. Essaie avec jointure disciplines (ta vraie structure)
        let { data: evData, error: evError } = await supabase
          .from("events")
          .select("id, name, date, location, city, badge, image_url, discipline_id, disciplines(id, name, slug)")
          .order("date", { ascending: true })

        // Fallback si jointure échoue (RLS ou pas de FK) -> select simple
        if (evError) {
          console.warn("Jointure events->disciplines échouée, fallback select *:", evError.message)
          const { data: simple } = await supabase.from("events").select("*").order("date", { ascending: true })
          evData = simple as any
        }

        const { data: discData } = await supabase.from("disciplines").select("id, name, slug").order("name")

        if (evData && evData.length > 0) setEvents(evData)
        if (discData) setAllDisciplines(discData)

      } catch (e) {
        console.warn("Erreur chargement Supabase, fallback utilisé", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const initialEvents = events.length > 0 ? events : FALLBACK

  const filterOptions = useMemo(() => {
    // Filtres depuis disciplines réelles + celles des events
    const fromEvents = new Set(initialEvents.map((e: any) => e.disciplines?.name).filter(Boolean))
    const fromTable = allDisciplines.map((d: any) => d.name)
    const merged = new Set([...Array.from(fromEvents), ...fromTable])
    return ["Tous", ...Array.from(merged)]
  }, [initialEvents, allDisciplines])

  const sortedEvents = useMemo(() => {
    return [...initialEvents]
      .filter((e: any) => {
        if (filterDiscipline === "Tous") return true
        return e.disciplines?.name === filterDiscipline
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [initialEvents, filterDiscipline])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="font-mono text-sm text-neutral-400">Chargement des évènements...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="max-w-[1680px] mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* HEADER SANS NAVBAR */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-black font-mono uppercase tracking-tighter text-white">Évènements</h1>
            <p className="text-sm text-neutral-400 font-mono mt-2">
              {sortedEvents.length} évènements • Triés par date la plus proche • <span className="text-red-500">J-3 en rouge</span> • <span className="text-red-500">LIVE</span>
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800">
            <button onClick={() => setView("cards")} className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${view==="cards" ? "bg-white text-black" : "text-neutral-400 hover:text-white"}`}>
              <Grid3x3 size={14} /> Cartes
            </button>
            <button onClick={() => setView("list")} className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${view==="list" ? "bg-white text-black" : "text-neutral-400 hover:text-white"}`}>
              <List size={14} /> Liste
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((d) => (
            <button key={d} onClick={() => setFilterDiscipline(d)} className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider border transition-all ${filterDiscipline===d ? "bg-white text-black border-white" : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white"}`}>
              {d}
            </button>
          ))}
        </div>

        {view === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedEvents.map((event: any) => {
              const { status, diffDays } = getEventStatus(event.date)
              const isJ3 = status === "J-3"
              const isLive = status === "LIVE"
              return (
                <div key={event.id} className={`bg-neutral-900 border overflow-hidden flex flex-col group transition-all ${isJ3 ? "border-red-500/30 bg-red-500/[0.02]" : isLive ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-neutral-800 hover:border-neutral-700"}`}>
                  <div className="relative h-48 bg-neutral-950 overflow-hidden">
                    <img src={event.image_url || "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop"} alt={event.name} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3"><span className="px-2 py-1 bg-black/80 text-neutral-300 text-[9px] font-mono font-bold border border-neutral-700 uppercase tracking-widest">{event.badge || "OFFICIEL"}</span></div>
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      {isLive && <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-[10px] font-mono font-black border border-red-500/30 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE</span>}
                      {isJ3 && <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-mono font-black uppercase tracking-widest">J-{diffDays}</span>}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono font-bold uppercase tracking-wider">{event.disciplines?.name || "MMA"}</span>
                      <h3 className="font-mono font-bold text-sm text-white uppercase tracking-tight mt-2 line-clamp-2 leading-tight">{event.name}</h3>
                    </div>
                    <div className="space-y-1.5 text-[11px] font-mono text-neutral-400 border-t border-neutral-800/60 pt-3 mt-auto">
                      <div className="flex items-center gap-1.5"><MapPin size={12} className="text-neutral-600 shrink-0" /><span className="truncate">{event.location || event.city}</span></div>
                      <div className={`flex items-center gap-1.5 ${isJ3 ? "text-red-500 font-bold" : ""}`}><Calendar size={12} className={isJ3 ? "text-red-500" : "text-neutral-600"} /><span>{new Date(event.date).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" })} {isJ3 && `• J-${diffDays}`}</span></div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Link href={`/events/${event.id}`} className="flex-1 py-2.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider text-center hover:bg-neutral-200 transition-colors">Réserver</Link>
                      <Link href={`/events/${event.id}`} className="flex-1 py-2.5 border border-neutral-700 text-neutral-300 text-xs font-mono font-bold uppercase tracking-wider text-center hover:text-white hover:border-white transition-colors">Voir détails</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event: any) => {
              const { status, diffDays } = getEventStatus(event.date)
              const isJ3 = status === "J-3"
              const isLive = status === "LIVE"
              return (
                <div key={event.id} className={`bg-neutral-900 border p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center transition-all ${isJ3 ? "border-red-500/30 bg-red-500/[0.02]" : isLive ? "border-red-500/40" : "border-neutral-800 hover:border-neutral-700"}`}>
                  <img src={event.image_url || "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=200&auto=format&fit=crop"} alt={event.name} className="w-full lg:w-24 h-24 object-cover border border-neutral-800 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono font-bold uppercase">{event.disciplines?.name || "MMA"}</span>
                      {isLive && <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-mono font-black uppercase flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" /> LIVE</span>}
                      {isJ3 && <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-mono font-black uppercase">J-{diffDays}</span>}
                    </div>
                    <h3 className="font-mono font-bold text-sm text-white uppercase truncate">{event.name}</h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-[11px] font-mono text-neutral-400">
                      <span className="flex items-center gap-1"><MapPin size={12} />{event.location}</span>
                      <span className={`flex items-center gap-1 ${isJ3 ? "text-red-500 font-bold" : ""}`}><Calendar size={12} />{new Date(event.date).toLocaleDateString("fr-FR")} {isJ3 && `• J-${diffDays}`}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto shrink-0">
                    <Link href={`/events/${event.id}`} className="flex-1 lg:flex-none px-5 py-2.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider text-center hover:bg-neutral-200">Réserver</Link>
                    <Link href={`/events/${event.id}`} className="flex-1 lg:flex-none px-5 py-2.5 border border-neutral-700 text-neutral-300 text-xs font-mono uppercase text-center hover:text-white hover:border-white">Voir détails</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
