"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, ShieldCheck, Trophy, Target, Zap, HelpCircle } from "lucide-react"

// Données fictives enrichies pour la démo (Judo, MMA, Boxe, etc.)
const MOCK_FIGHTERS = [
  {
    id: "1",
    name: "Rindra 'The Storm' Andrianina",
    discipline: "MMA",
    category: "-77 kg (Welterweight)",
    origin: "Antananarivo",
    club: "Tana Fight Team",
    record: { wins: 8, losses: 1, draws: 0 },
    ratio: "88%",
    status: "Professionnel",
    verified: true,
    image: "https://media.istockphoto.com/id/1475242112/photo/fitness-boxer-portrait-and-black-man-with-gloves-to-fight-for-sports-training-and-workout-in.jpg?s=612x612&w=0&k=20&c=aiNrEXhCxXYM09r4AzmouYSSp1Cx3Ictobe2RG6FCkM="
  },
  {
    id: "2",
    name: "Sitraka Rakotomalala",
    discipline: "Judo",
    category: "-73 kg",
    origin: "Mahajanga",
    club: "Baobab Judo Club",
    record: { wins: 24, losses: 4, draws: 0 },
    ratio: "85%",
    status: "Élite National",
    verified: true,
    image: "https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2018/03/EBINUMA_OLD_2-1521218487-1521218487.jpg"
  }
]

export default function CombattantsAnnuaire() {
  const [search, setSearch] = useState("")
  const [selectedDiscipline, setSelectedDiscipline] = useState("Tous")

  const disciplines = ["Tous", "MMA", "Judo", "Kick-Boxing", "Boxe Anglaise", "Karaté"]

  return (
    <div className="min-h-screen bg-black text-slate-100 pt-20 font-sans">
      
      {/* HEADER HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center border-b border-neutral-900">
        <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs font-mono uppercase tracking-widest text-amber-400 mb-4">
          <Zap size={12} /> Base de Données Officielle des Athlètes
        </div>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
          Annuaire des <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">Combattants</span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-neutral-400 font-mono leading-relaxed">
          Découvre, suis et recrute les meilleurs talents des sports de combat à Madagascar. Profils vérifiés, palmarès authentifiés et statistiques en temps réel.
        </p>
      </section>

      {/* COMPTEURS DE CONFIANCE (STATISTIQUES DE LA PLATEFORME) */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 py-8 text-center">
        <div className="bg-neutral-950 border border-neutral-900 p-4">
          <div className="text-2xl font-black font-mono text-white">450+</div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono mt-1">Combattants Inscrits</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-900 p-4">
          <div className="text-2xl font-black font-mono text-emerald-500">92%</div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono mt-1">Profils Vérifiés</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-900 p-4">
          <div className="text-2xl font-black font-mono text-amber-500">24</div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono mt-1">Clubs Partenaires</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-900 p-4">
          <div className="text-2xl font-black font-mono text-blue-500">18</div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono mt-1">Événements Trackés</div>
        </div>
      </section>

      {/* SECTION PRINCIPALE : RECHERCHE & LISTING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* RECHERCHE ET BARRE DE FILTRES LATÉRALE */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-neutral-950 border border-neutral-900 p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white font-bold pb-2 border-b border-neutral-900">
              <SlidersHorizontal size={14} /> Filtrer l'arène
            </div>
            
            {/* Barre de recherche */}
            <div className="relative">
              <input
                type="text"
                placeholder="Nom, club, ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black border border-neutral-800 text-xs px-3 py-2.5 pl-9 text-white focus:outline-none focus:border-red-500 font-mono"
              />
              <Search className="absolute left-3 top-3 text-neutral-500" size={14} />
            </div>

            {/* Filtre Disciplines */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider block">Discipline</label>
              <div className="flex flex-wrap gap-1.5">
                {disciplines.map((disc) => (
                  <button
                    key={disc}
                    onClick={() => setSelectedDiscipline(disc)}
                    className={`text-[10px] font-mono uppercase px-2.5 py-1.5 border transition-colors ${
                      selectedDiscipline === "" || selectedDiscipline === disc
                        ? "bg-white text-black border-white font-bold"
                        : "bg-black text-neutral-400 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {disc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* GRILLE DES COMBATTANTS */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_FIGHTERS.map((fighter) => (
              <div 
                key={fighter.id} 
                className="bg-neutral-950 border border-neutral-900 overflow-hidden flex flex-col justify-between group hover:border-neutral-700 transition-all"
              >
                <div className="p-5 flex gap-4">
                  {/* Photo d'identité de l'athlète */}
                  <div className="w-20 h-24 bg-neutral-900 shrink-0 border border-neutral-800 overflow-hidden relative">
                    <img 
                      src={fighter.image} 
                      alt={fighter.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                  
                  {/* Infos Métier / Combat */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-red-950 text-red-400 border border-red-900 font-mono px-2 py-0.5 uppercase tracking-wider font-bold">
                        {fighter.discipline}
                      </span>
                      {fighter.verified && (
                        <span className="text-blue-400 flex items-center gap-0.5 text-[9px] font-mono uppercase bg-blue-950/40 px-1.5 py-0.5 border border-blue-900/50">
                          <ShieldCheck size={10} /> Vérifié
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white truncate font-sans tracking-tight">
                      {fighter.name}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono truncate">{fighter.club} ({fighter.origin})</p>
                    <p className="text-[11px] text-neutral-500 font-mono">{fighter.category}</p>
                  </div>
                </div>

                {/* Barre de Stats & Fiche */}
                <div className="bg-neutral-900/50 border-t border-neutral-900 px-5 py-3 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-neutral-500 mr-1">FIGHT:</span>
                    <span className="text-emerald-500 font-bold">{fighter.record.wins}V</span>
                    <span className="text-neutral-600 font-bold mx-0.5">-</span>
                    <span className="text-red-500 font-bold">{fighter.record.losses}D</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Ratio Win: <span className="text-white font-bold">{fighter.ratio}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION FAQ */}
      <section className="bg-neutral-950 border-t border-b border-neutral-900 py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2 text-amber-500 text-xs font-mono uppercase tracking-widest">
            <HelpCircle size={14} /> Des questions ?
          </div>
          <h2 className="text-2xl font-black uppercase text-center text-white mb-10 tracking-tight">
            Tout ce que tu dois savoir sur l'annuaire
          </h2>
          
          <div className="space-y-6 text-sm font-sans">
            <div className="border-b border-neutral-900 pb-4">
              <h3 className="font-bold text-white mb-2 font-mono text-xs uppercase tracking-wider text-red-500">
                Qui peut s'inscrire dans l'annuaire ?
              </h3>
              <p className="text-neutral-400 leading-relaxed text-xs">
                Tous les pratiquants de sports de combat à Madagascar (Judo, MMA, Boxe, Karaté, Sanda, Grappling...). Que tu sois un jeune amateur en plein essor ou un professionnel chevronné, tu as ta place ici.
              </p>
            </div>
            <div className="border-b border-neutral-900 pb-4">
              <h3 className="font-bold text-white mb-2 font-mono text-xs uppercase tracking-wider text-blue-500">
                Comment fonctionne la certification des profils ?
              </h3>
              <p className="text-neutral-400 leading-relaxed text-xs">
                Une fois inscrit, notre équipe croise tes données avec celles de ta fédération officielle ou de tes coachs certifiés pour authentifier ton palmarès. Une fois validé, tu obtiens le badge bleu d'authenticité.
              </p>
            </div>
            <div className="border-b border-neutral-900 pb-4">
              <h3 className="font-bold text-white mb-2 font-mono text-xs uppercase tracking-wider text-amber-500">
                Quels sont les avantages d'être répertorié ?
              </h3>
              <p className="text-neutral-400 leading-relaxed text-xs">
                Une visibilité maximale devant les promoteurs d'événements nationaux et internationaux, la recherche simplifiée pour les sponsors en quête d'athlètes à sponsoriser, et un historique de carrière infalsifiable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ÉNORME CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 p-8 md:p-12 relative overflow-hidden">
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-none">
              Prêt à faire passer ta carrière au <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-500">
                niveau supérieur ?
              </span>
            </h2>
            
            <p className="max-w-xl mx-auto text-xs text-neutral-400 font-mono leading-relaxed">
              Rejoins la plus grande communauté de combattants de Madagascar. Ne reste plus dans l'ombre. Crée ton profil d'athlète dès maintenant, affiche tes victoires et fais-toi repérer par les managers et sponsors.
            </p>

            <div className="pt-4">
              <Link 
                href="/auth?role=combattant"
                className="inline-block px-8 py-4 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-mono text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-xl"
              >
                Créer ma fiche combattant maintenant
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-[10px] font-mono text-neutral-500 pt-6 border-t border-neutral-900/60">
              <div className="flex items-center gap-1"><Trophy size={12} className="text-amber-500" /> Inscription 100% Gratuite</div>
              <div className="flex items-center gap-1"><Target size={12} className="text-red-500" /> Visibilité Promoteurs</div>
              <div className="flex items-center gap-1"><ShieldCheck size={12} className="text-blue-500" /> Historique Protégé</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}