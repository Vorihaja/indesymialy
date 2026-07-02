import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const fightersCountResponse = await supabase.from("fighters").select("id", { count: "exact", head: true });
  const contractsCountResponse = await supabase.from("contracts").select("id", { count: "exact", head: true });

  const fightersCount = typeof fightersCountResponse.count === "number" ? fightersCountResponse.count : 120;
  const contractsCount = typeof contractsCountResponse.count === "number" ? contractsCountResponse.count : 15;

  const cards = [
    {
      title: "Combattants",
      description: "Découvrez le roster complet et suivez les performances des athlètes malgaches.",
      href: "/combattants",
    },
    {
      title: "Organisateur",
      description: "Accédez au tableau de bord organisateur pour piloter vos événements et billetterie.",
      href: "/dashboard/organisateur",
    },
    {
      title: "Sponsor",
      description: "Gérez les partenariats et contrats de sponsoring avec les meilleurs clubs.",
      href: "/dashboard/sponsor",
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(180deg,#020617_0%,#05050a_100%)] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_24%)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-72 bg-[radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.14),_transparent_24%)] blur-3xl" />

        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400/80">Indesy Mialy</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Plateforme de combat & événementiel à Madagascar</h1>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link href="/combattants" className="transition hover:text-white">Combattants</Link>
            <Link href="/dashboard/organisateur" className="transition hover:text-white">Organisateur</Link>
            <Link href="/dashboard/sponsor" className="transition hover:text-white">Sponsor</Link>
            <Link href="/marketplace" className="transition hover:text-white">Marketplace</Link>
          </nav>
        </header>

        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[1.25fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <div className="max-w-2xl space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-400">Gestion complète</p>
                <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Une expérience claire, rapide et professionnelle pour vos compétitions.</h2>
                <p className="text-base leading-8 text-slate-300">Suivez les athlètes, pilotez les événements et activez vos sponsors avec une interface moderne pensée pour Madagascar.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/combattants" className="inline-flex items-center justify-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400">Voir les combattants</Link>
                <Link href="/dashboard/organisateur" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-amber-400 hover:text-amber-300">Espace organisateur</Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.4)]">
                <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Statistiques clés</p>
                <div className="mt-6 grid gap-4">
                  <div className="rounded-3xl bg-slate-950/80 p-5">
                    <p className="text-sm text-slate-400">Événements prévus</p>
                    <p className="mt-3 text-3xl font-extrabold text-white">3</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/80 p-5">
                    <p className="text-sm text-slate-400">Combattants listés</p>
                    <p className="mt-3 text-3xl font-extrabold text-white">{fightersCount ?? "120+"}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/80 p-5">
                    <p className="text-sm text-slate-400">Contrats gérés</p>
                    <p className="mt-3 text-3xl font-extrabold text-white">{contractsCount ?? "15"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.4)]">
                <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Prochain événement</p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-[#0c1120] p-5">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">MAHAJANGA FIGHT NIGHT</p>
                    <p className="mt-3 text-xl font-bold text-white">12 juillet 2026</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Complexe Sportif Mahajanga • 14 combats prévus</p>
                  </div>
                  <div className="rounded-3xl bg-[#0c1120] p-5">
                    <p className="text-sm text-slate-400">Gestion de billetterie, planning et suivi des combattants en temps réel.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-amber-400/40 hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">{card.title}</p>
                    <p className="mt-4 text-base leading-7 text-slate-200">{card.description}</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-3 text-amber-300 transition group-hover:bg-white/20">→</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
