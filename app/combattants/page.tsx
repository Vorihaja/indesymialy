"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDisciplineFilter } from '../discipline-filter-context';
import { supabase } from '@/lib/supabase';

type Fighter = {
  id: string;
  name?: string;
  discipline?: string;
  region?: string;
  province?: string;
  record?: string;
  club?: string;
  rank?: number | null;
  cat?: string;
};

const fallbackProvinces = ["Toutes", "Majunga", "Tananarive", "Tamatave", "Fianarantsoa", "Tuléar", "Diégo"];

const FIGHTERS_DEMO: Fighter[] = [
  {
    id: "demo-1",
    name: "Ali Razafindrabe",
    discipline: "MMA",
    province: "Tananarive",
    record: "12-3-1",
    club: "Tana Fight Club",
    rank: 1,
  },
  {
    id: "demo-2",
    name: "Miora Andrianarisoa",
    discipline: "Boxe anglaise",
    province: "Tamatave",
    record: "9-1-0",
    club: "East Coast Boxing",
    rank: 2,
  },
  {
    id: "demo-3",
    name: "Faly Ramilison",
    discipline: "Kickboxing",
    province: "Majunga",
    record: "15-2-0",
    club: "Boeny Fight Club",
    rank: 3,
  },
  {
    id: "demo-4",
    name: "Lalao Randrianarisoa",
    discipline: "Taekwondo",
    province: "Fianarantsoa",
    record: "8-0-0",
    club: "Highland Dojo",
    rank: 4,
  },
  {
    id: "demo-5",
    name: "Jean Rakoto",
    discipline: "Judo",
    province: "Diégo",
    record: "11-4-1",
    club: "Northern Grappling",
    rank: 5,
  },
];

export default function Combattants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("Toutes");
  const [remoteFighters, setRemoteFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const { selectedDisciplines } = useDisciplineFilter();

  useEffect(() => {
    const fetchFighters = async () => {
      setLoading(true);
      setRemoteError(null);
      const { data, error } = await supabase.from('fighters').select('*');
      if (error) {
        const message = error.message || 'Erreur de lecture Supabase';
        console.error('Supabase fighters fetch error:', error);
        setRemoteError(message);
      } else if (data?.length) {
        setRemoteFighters(data as Fighter[]);
      }
      setLoading(false);
    };

    fetchFighters();
  }, []);

  const fighters = remoteFighters.length > 0 ? remoteFighters : FIGHTERS_DEMO;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const disciplines = useMemo(() => {
    const values = new Set<string>();
    fighters.forEach((fighter) => {
      const discipline = (fighter.discipline ?? fighter.cat ?? '').trim();
      if (discipline) values.add(discipline);
    });
    return ["Toutes", ...Array.from(values).sort()];
  }, [fighters]);

  const provinces = useMemo(() => {
    const values = new Set<string>(fallbackProvinces.filter((p) => p !== 'Toutes'));
    fighters.forEach((fighter) => {
      const province = fighter.province?.trim() ?? fighter.region?.trim();
      if (province) values.add(province);
    });
    return ["Toutes", ...Array.from(values).sort()];
  }, [fighters]);

  const filteredFighters = fighters.filter((fighter) => {
    const matchesSearch = (fighter.name ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const fighterProvince = fighter.province ?? fighter.region ?? '';
    const matchesProvince = selectedProvince === "Toutes" || fighterProvince === selectedProvince;
    const disciplineSource = (fighter.discipline ?? fighter.cat ?? '').toString();
    const matchesDiscipline =
      selectedDisciplines.length === 0
        ? true
        : selectedDisciplines.some((discipline) => disciplineSource.includes(discipline));

    return matchesSearch && matchesProvince && matchesDiscipline;
  });

  const groupedFighters = useMemo(() => {
    const groups = new Map<string, Fighter[]>();
    filteredFighters.forEach((fighter) => {
      const discipline = (fighter.discipline ?? fighter.cat ?? 'Non défini').trim() || 'Non défini';
      if (!groups.has(discipline)) {
        groups.set(discipline, []);
      }
      groups.get(discipline)?.push(fighter);
    });

    return Array.from(groups.entries())
      .map(([discipline, fighters]) => ({
        discipline,
        fighters: fighters.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
      }))
      .sort((a, b) => a.discipline.localeCompare(b.discipline));
  }, [filteredFighters]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_20%)] blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-72 bg-[radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_20%)] blur-3xl" />

        <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.32)] backdrop-blur-xl">
            <div className="lg:flex lg:items-center lg:justify-between gap-10">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.32em] text-amber-400">Combattants</p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Trouvez votre prochain champion malgache.</h1>
                <p className="mt-4 text-slate-400 leading-7">Explorez les athlètes par discipline, région et club. Un tableau élégant pour naviguer rapidement dans les profils du circuit.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:w-[320px]">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Disciplines</p>
                  <p className="mt-3 text-3xl font-black text-white">8+</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Clubs</p>
                  <p className="mt-3 text-3xl font-black text-white">5</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <input
                type="text"
                placeholder="Rechercher un athlète..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl px-5 py-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition"
              />
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-3xl px-5 py-4 text-sm text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition"
              >
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>{prov === "Toutes" ? "Toutes les provinces" : prov}</option>
                ))}
              </select>
            </div>
            {remoteError && (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                Erreur Supabase : {remoteError}. Les données de démonstration sont affichées.
              </div>
            )}
            {loading && (
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                Chargement des combattants depuis Supabase...
              </div>
            )}

            <div className="space-y-10">
              {groupedFighters.length > 0 ? (
                groupedFighters.map((group) => (
                  <section key={group.discipline} className="space-y-5 rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">{group.discipline}</h2>
                        <p className="text-sm text-slate-400">{group.fighters.length} combattant{group.fighters.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {group.fighters.map((fighter) => (
                        <div key={fighter.id} className="group relative overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-6 transition hover:-translate-y-0.5 hover:border-amber-500/30 hover:shadow-[0_30px_90px_rgba(245,158,11,0.08)]">
                          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                          <div className="relative space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300">{fighter.discipline ?? fighter.cat}</span>
                              <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-300 border border-slate-800">{fighter.record}</span>
                            </div>
                            <div>
                              <Link href={`/combattants/${fighter.id}`} className="text-xl font-extrabold text-white hover:text-amber-400 transition">{fighter.name}</Link>
                              <p className="mt-3 text-sm text-slate-400">{fighter.club}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                              <span>{fighter.province ?? fighter.region ?? '—'}</span>
                              <span className="text-right">Classement #{fighter.rank}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-10 text-center text-slate-500">
                  Aucun athlète ne correspond à ces critères.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
