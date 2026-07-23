"use client"
import { useState, useEffect, useMemo, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Calendar, MapPin, Grid3x3, List } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { useDisciplineFilter } from "../../providers/search/discipline-filter-context"

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

function EventsContent() {
  const [view, setView] = useState<"cards" | "list">("cards")
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres globaux depuis GlobalSearchBar
  const { selectedDisciplines, isAllSelected } = useDisciplineFilter()
  const searchParams = useSearchParams()
  const globalSearch   = searchParams?.get("search")   || ""
  const globalRegion   = searchParams?.get("region")   || ""
  const globalVille    = searchParams?.get("ville")    || ""
  const globalDateFrom = searchParams?.get("dateFrom") || ""
  const globalDateTo   = searchParams?.get("dateTo")   || ""

  useEffect(() => {
    async function load() {
      try {
        let { data: evData, error: evError } = await supabase
          .from("events")
          .select("id, name, date, location, city, badge, image_url, discipline_id, disciplines(id, name, slug)")
          .order("date", { ascending: true })

        if (evError) {
          const { data: simple } = await supabase.from("events").select("*").order("date", { ascending: true })
          evData = simple as any
        }

        if (evData && evData.length > 0) {
          setEvents(evData)
        } else {
          setEvents(FALLBACK)
        }
      } catch (err) {
        setEvents(FALLBACK)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filtrage combiné (disciplines + recherche + ville/région + dates)
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const discName = evt.disciplines?.name || "MMA"
      const evtLoc = evt.location || evt.city || ""
      const evtDate = evt.date ? new Date(evt.date) : null

      if (globalSearch && !evt.name?.toLowerCase().includes(globalSearch.toLowerCase())) return false
      if (globalRegion && !evtLoc.toLowerCase().includes(globalRegion.toLowerCase())) return false
      if (globalVille  && !evtLoc.toLowerCase().includes(globalVille.toLowerCase())) return false

      if (globalDateFrom && evtDate) {
        const df = new Date(globalDateFrom)
        if (evtDate < df) return false
      }
      if (globalDateTo && evtDate) {
        const dt = new Date(globalDateTo)
        dt.setHours(23, 59, 59, 999)
        if (evtDate > dt) return false
      }

      if (!isAllSelected && !selectedDisciplines.some(d => discName.toLowerCase().includes(d.toLowerCase()))) {
        return false
      }

      return true
    })
  }, [events, selectedDisciplines, isAllSelected, globalSearch, globalRegion, globalVille, globalDateFrom, globalDateTo])

  // Tri : LIVE en premier, puis J-3, puis futures, puis passées
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const statusA = getEventStatus(a.date).status
      const statusB = getEventStatus(b.date).status
      const order = { LIVE: 0, "J-3": 1, NORMAL: 2, PASSÉ: 3 }
      const diff = (order[statusA] ?? 2) - (order[statusB] ?? 2)
      if (diff !== 0) return diff
      return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
    })
  }, [filteredEvents])

  const liveCount = events.filter(e => getEventStatus(e.date).status === "LIVE").length
  const j3Count   = events.filter(e => getEventStatus(e.date).status === "J-3").length

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-red-600 selection:text-white antialiased">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-neutral-900 pb-6">
          <div className="space-y-1">
            <h1 className="font-mono font-black text-[36px] leading-none tracking-tighter uppercase text-white">
              ÉVÉNEMENTS <span className="text-red-600">/</span> CALENDRIER
            </h1>
            <div className="flex items-center gap-3">
              <span className="h-1 w-8 bg-red-600 rounded-none" />
              <p className="font-mono text-[11px] font-bold tracking-widest text-neutral-500 uppercase">
                {sortedEvents.length} compétition{sortedEvents.length > 1 ? "s" : ""} disponible{sortedEvents.length > 1 ? "s" : ""}
                {liveCount > 0 && <span className="text-red-500 ml-2 font-black">• {liveCount} EN DIRECT</span>}
                {j3Count > 0 && <span className="text-red-400 ml-2 font-bold">• {j3Count} EN COMPTE À REBOURS (J-3)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("cards")}
              className={`p-2 border font-mono text-xs flex items-center gap-1.5 transition-colors ${view === "cards" ? "bg-white text-black border-white font-bold" : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"}`}
            >
              <Grid3x3 size={14} /> CARTE
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 border font-mono text-xs flex items-center gap-1.5 transition-colors ${view === "list" ? "bg-white text-black border-white font-bold" : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"}`}
            >
              <List size={14} /> LISTE
            </button>
          </div>
        </div>

        {/* BANDEAU FILTRES ACTIFS */}
        {(!isAllSelected || globalSearch || globalRegion || globalVille || globalDateFrom) && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-neutral-900 border-l-4 border-amber-500 rounded-none">
            <div className="flex items-center gap-2 font-mono text-[11px] font-black text-amber-500 uppercase tracking-wider">
              FILTRES ACTIFS
            </div>
            <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
            <div className="flex flex-wrap gap-2">
              {globalSearch && <span className="px-3 py-1 bg-white text-black rounded-none text-[10px] font-mono font-black uppercase tracking-wider">{globalSearch}</span>}
              {globalRegion && <span className="px-3 py-1 bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider">{globalRegion}</span>}
              {globalVille  && <span className="px-3 py-1 bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider">{globalVille}</span>}
              {globalDateFrom && <span className="px-3 py-1 bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider">DEPUIS {globalDateFrom}</span>}
              {!isAllSelected && <span className="px-3 py-1 bg-blue-950 text-blue-400 border border-blue-800 rounded-none text-[10px] font-mono font-black uppercase tracking-wider">{selectedDisciplines.length} DISCIPLINES</span>}
            </div>
          </div>
        )}

        {/* AFFICHAGE DES ÉVÉNEMENTS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 bg-neutral-900 border border-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="py-24 text-center border border-neutral-800 bg-neutral-900 space-y-3">
            <div className="font-mono font-black text-lg text-neutral-600 uppercase tracking-widest">— AUCUN ÉVÉNEMENT TROUVÉ —</div>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider">Modifiez vos critères de recherche dans la barre globale.</p>
          </div>
        ) : view === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {sortedEvents.map((event: any) => {
              const { status, diffDays } = getEventStatus(event.date)
              const isJ3 = status === "J-3"
              const isLive = status === "LIVE"

              return (
                <div
                  key={event.id}
                  className={`bg-neutral-900 border flex flex-col transition-all duration-300 ${
                    isJ3
                      ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] relative overflow-hidden"
                      : isLive
                      ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)] relative"
                      : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="relative h-44 bg-neutral-950 overflow-hidden">
                    <img
                      src={event.image_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop"}
                      alt={event.name}
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {event.badge && (
                        <span className="px-2 py-0.5 bg-black/80 text-white border border-neutral-700 text-[9px] font-mono font-bold uppercase tracking-wider">
                          {event.badge}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                      {isLive && (
                        <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-mono font-black uppercase tracking-widest animate-pulse flex items-center gap-1.5 shadow-lg">
                          <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                        </span>
                      )}
                      {isJ3 && (
                        <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-mono font-black uppercase tracking-widest">
                          J-{diffDays}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono font-bold uppercase tracking-wider">
                        {event.disciplines?.name || "MMA"}
                      </span>
                      <h3 className="font-mono font-bold text-sm text-white uppercase tracking-tight mt-2 line-clamp-2 leading-tight">
                        {event.name}
                      </h3>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-mono text-neutral-400 border-t border-neutral-800/60 pt-3 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-neutral-600 shrink-0" />
                        <span className="truncate">{event.location || event.city}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${isJ3 ? "text-red-500 font-bold" : ""}`}>
                        <Calendar size={12} className={isJ3 ? "text-red-500" : "text-neutral-600"} />
                        <span>
                          {new Date(event.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}{" "}
                          {isJ3 && `• J-${diffDays}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link href={`/events/${event.id}`} className="flex-1 py-2.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider text-center hover:bg-neutral-200 transition-colors">
                        Réserver
                      </Link>
                      <Link href={`/events/${event.id}`} className="flex-1 py-2.5 border border-neutral-700 text-neutral-300 text-xs font-mono font-bold uppercase tracking-wider text-center hover:text-white hover:border-white transition-colors">
                        Voir détails
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map((event: any) => {
              const { status, diffDays } = getEventStatus(event.date)
              const isJ3 = status === "J-3"
              const isLive = status === "LIVE"

              return (
                <div
                  key={event.id}
                  className={`bg-neutral-900 border px-4 py-3 flex flex-wrap lg:flex-nowrap gap-4 items-center justify-between transition-all ${
                    isJ3 ? "border-red-500/30 bg-red-500/[0.02]" : isLive ? "border-red-500/40" : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono font-bold uppercase">
                        {event.disciplines?.name || "MMA"}
                      </span>
                      {isLive && (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-mono font-black uppercase flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" /> LIVE
                        </span>
                      )}
                      {isJ3 && <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-mono font-black uppercase">J-{diffDays}</span>}
                    </div>
                    <h3 className="font-mono font-bold text-xs sm:text-sm text-white uppercase truncate">{event.name}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-neutral-400 shrink-0">
                    <span className="flex items-center gap-1 truncate max-w-[220px]">
                      <MapPin size={12} className="shrink-0" />
                      {event.location}
                    </span>
                    <span className={`flex items-center gap-1 shrink-0 ${isJ3 ? "text-red-500 font-bold" : ""}`}>
                      <Calendar size={12} className="shrink-0" />
                      {new Date(event.date).toLocaleDateString("fr-FR")} {isJ3 && `• J-${diffDays}`}
                    </span>
                  </div>

                  <div className="flex gap-2 shrink-0 w-full lg:w-auto">
                    <Link href={`/events/${event.id}`} className="px-4 py-1.5 bg-white text-black text-[11px] font-mono font-bold uppercase tracking-wider text-center hover:bg-neutral-200">
                      Réserver
                    </Link>
                    <Link href={`/events/${event.id}`} className="px-4 py-1.5 border border-neutral-700 text-neutral-300 text-[11px] font-mono uppercase text-center hover:text-white hover:border-white">
                      Détails
                    </Link>
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

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white grid place-items-center font-mono text-xs">CHARGEMENT DES ÉVÉNEMENTS...</div>}>
      <EventsContent />
    </Suspense>
  )
}