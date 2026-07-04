import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  // -----------------------------
  // STATS GLOBAL PLATFORM
  // -----------------------------
  const [{ count: fightersCount }, { count: contractsCount }, { count: eventsCount }] =
    await Promise.all([
      supabase.from("fighters").select("id", { count: "exact", head: true }),
      supabase.from("contracts").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
    ]);

  const safeFighters = fightersCount ?? 120;
  const safeContracts = contractsCount ?? 15;
  const safeEvents = eventsCount ?? 3;

  // -----------------------------
  //  PROCHAIN ÉVÉNEMENT
  // -----------------------------
  const { data: nextEvent } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const event = nextEvent ?? {
    title: "MAHAJANGA FIGHT NIGHT",
    date: "12 juillet 2026",
    location: "Complexe Sportif Mahajanga",
    fights: 14,
  };

  // -----------------------------
  //  ACTIVITÉ RÉCENTE (SIMPLIFIÉE MVP)
  // -----------------------------
  const { data: recentFighters } = await supabase
    .from("fighters")
    .select("name, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: recentEvents } = await supabase
    .from("events")
    .select("title, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  // -----------------------------
  //  NAVIGATION CARDS
  // -----------------------------
  const cards = [
    {
      title: "Combattants",
      description: "Suivez les athlètes et leurs performances.",
      href: "/combattants",
    },
    {
      title: "Organisateur",
      description: "Gérez vos événements et billetterie.",
      href: "/dashboard/organisateur",
    },
    {
      title: "Sponsor",
      description: "Gérez vos partenariats sportifs.",
      href: "/dashboard/sponsor",
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(180deg,#020617_0%,#05050a_100%)] text-white">

      {/* ================= HEADER ================= */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400/80">
            Indesy Mialy
          </p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            Plateforme des sports de combat à Madagascar
          </h1>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.25fr_0.85fr]">

          {/* LEFT */}
          <div className="space-y-8">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-400">
              Écosystème sportif
            </p>

            <h2 className="text-4xl font-extrabold sm:text-5xl">
              Une infrastructure complète pour gérer, suivre et développer les combats.
            </h2>

            <p className="text-slate-300 leading-8">
              Combattants, clubs, événements, sponsors et marketplace réunis dans une seule plateforme centralisée.
            </p>

            <div className="flex gap-3">
              <Link className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-black" href="/combattants">
                Explorer
              </Link>
              <Link className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm" href="/dashboard/organisateur">
                Créer un événement
              </Link>
            </div>
          </div>

          {/* RIGHT - STATS */}
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">

            <p className="text-sm uppercase text-amber-300">
              Plateforme active
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl bg-black/40 p-4">
                <p className="text-sm text-slate-400">Combattants</p>
                <p className="text-3xl font-bold">{safeFighters}</p>
              </div>

              <div className="rounded-2xl bg-black/40 p-4">
                <p className="text-sm text-slate-400">Événements</p>
                <p className="text-3xl font-bold">{safeEvents}</p>
              </div>

              <div className="rounded-2xl bg-black/40 p-4">
                <p className="text-sm text-slate-400">Contrats</p>
                <p className="text-3xl font-bold">{safeContracts}</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ================= LIVE ACTIVITY ================= */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">

        <h3 className="text-xl font-bold mb-6"> Activité récente</h3>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Fighters */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase text-amber-300 mb-4">Nouveaux combattants</p>

            {recentFighters?.length ? recentFighters.map((f, i) => (
              <p key={i} className="text-slate-300 text-sm py-1">
                 {f.name ?? "Combattant"} ajouté récemment
              </p>
            )) : (
              <p className="text-slate-400 text-sm">Aucune activité récente</p>
            )}
          </div>

          {/* Events */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase text-amber-300 mb-4">Événements récents</p>

            {recentEvents?.length ? recentEvents.map((e, i) => (
              <p key={i} className="text-slate-300 text-sm py-1">
                 {e.title ?? "Événement"} publié
              </p>
            )) : (
              <p className="text-slate-400 text-sm">Aucun événement récent</p>
            )}
          </div>

        </div>
      </section>

      {/* ================= NEXT EVENT ================= */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">

        <h3 className="text-xl font-bold mb-6"> Prochain événement</h3>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6">

          <p className="text-xs uppercase text-slate-500">{event.title}</p>
          <p className="text-2xl font-bold mt-2">{event.date}</p>
          <p className="text-slate-400 mt-2">
            {event.location} • {event.fights} combats
          </p>

        </div>
      </section>

      {/* ================= CARDS ================= */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">

          {cards.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-amber-400/40"
            >
              <p className="text-amber-300 uppercase text-sm">{c.title}</p>
              <p className="text-slate-300 mt-3">{c.description}</p>
            </Link>
          ))}

        </div>
      </section>

    </main>
  );
}