"use client";
import ErpShell from "../ErpShell";
import ErpAuthGuard from "../ErpAuthGuard";

export default function CoachDashboardPage() {
  const stats = [
    { label: "Athlètes suivis", value: "9", note: "Suivi complet performance, récupération et progression." },
    { label: "Sessions cette semaine", value: "18", note: "Planning structuré et relances automatisées." },
    { label: "Temps gagné", value: "47h", note: "Économie de temps grâce à l’IA coach." },
    { label: "Satisfaction", value: "96%", note: "Feedbacks positifs sur les parcours et séances." },
  ];

  const modules = [
    {
      id: "clients",
      title: "Clients & CRM",
      eyebrow: "Relation & suivi",
      description: "Pipeline prospects, fiches 360°, formulaires d’accueil et portail client en un seul espace.",
      bullets: ["Prospects → onboarding → actifs", "Alertes si plus de 7 jours sans interaction", "Badge Coach attentif"],
      accent: "from-amber-500/20 to-orange-500/10",
    },
    {
      id: "sessions",
      title: "Sessions & Agenda",
      eyebrow: "Temps & cadence",
      description: "Planification intelligente, notes de séance, replays et suivi de présence en temps réel.",
      bullets: ["Créneaux auto-proposés", "Replays et transcriptions", "Streak 0 no-show"],
      accent: "from-emerald-500/20 to-cyan-500/10",
    },
    {
      id: "programmes",
      title: "Programmes & Parcours",
      eyebrow: "Industrialisation",
      description: "Créer des parcours, assigner des modules, suivre la progression et débloquer des templates.",
      bullets: ["Créateur de parcours", "Progression client animée", "Certifications automatiques"],
      accent: "from-violet-500/20 to-fuchsia-500/10",
    },
    {
      id: "contenus",
      title: "Contenus & Bibliothèque",
      eyebrow: "Savoir & ressources",
      description: "Centralisez vos fichiers, supports, résumés IA et droits d’accès par client ou groupe.",
      bullets: ["Médiathèque partagée", "Snippets IA", "Ressources les plus utilisées"],
      accent: "from-sky-500/20 to-blue-500/10",
    },
    {
      id: "communaute",
      title: "Communauté Indesy",
      eyebrow: "Réseau & motivation",
      description: "Feed coachs, groupes de pratique, challenges mensuels et mentorat pair à pair.",
      bullets: ["Leaderboard léger", "Badges visibles", "FOMO positive"],
      accent: "from-rose-500/20 to-pink-500/10",
    },
    {
      id: "analytics",
      title: "Analytics & Performance",
      eyebrow: "Mesure & impact",
      description: "Suivez les résultats, le ROI, la rétention et les performances de vos parcours.",
      bullets: ["ROI coaching", "Taux de rétention", "Objectifs dépassés"],
      accent: "from-indigo-500/20 to-slate-500/10",
    },
  ];

  const priorities = [
    "Préparer la prochaine session de Faly avec un plan de récupération ciblé.",
    "Relancer les clients inactifs depuis 5 jours avec une aide personnalisée.",
    "Finaliser le parcours “Performance & mental” pour le prochain groupe.",
  ];

  const streaks = [
    { title: "7 jours de check-in", detail: "Rituels de suivi maintenus" },
    { title: "XP +20", detail: "Par séance complétée" },
    { title: "Niveau Mentor", detail: "Templates premium débloqués" },
  ];

  return (
    <ErpAuthGuard>
      <ErpShell
        title="ERP Coach"
        subtitle="Un cockpit unique pour piloter vos clients, séances, programmes et croissance avec une expérience addictive et professionnelle."
        stats={stats}
        actions={
          <button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
            Nouveau coaching
          </button>
        }
        sidebarTopItems={[
          { id: "dashboard", label: "Dashboard", href: "#dashboard" },
          { id: "messages", label: "Messages", href: "#messages" },
          { id: "finance", label: "Finance", href: "#finance" },
          { id: "clients", label: "Clients & CRM", href: "#clients" },
          { id: "sessions", label: "Sessions & Agenda", href: "#sessions" },
          { id: "programmes", label: "Programmes & Parcours", href: "#programmes" },
        ]}
        sidebarBottomItems={[
          { id: "contenus", label: "Contenus & Bibliothèque", href: "#contenus" },
          { id: "communaute", label: "Communauté Indesy", href: "#communaute" },
          { id: "analytics", label: "Analytics & Performance", href: "#analytics" },
          { id: "ia", label: "Automatisation & IA Coach", href: "#ia" },
          { id: "marketplace", label: "Marketplace & Ventes", href: "#marketplace" },
          { id: "settings", label: "Paramètres & Profil", href: "#settings" },
        ]}
        activeSidebarId="dashboard"
      >
        <div id="dashboard" className="space-y-8">
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 p-7 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
              <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">
                Aujourd’hui
              </div>
              <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
                Votre cockpit de coaching est prêt à accélérer chaque interaction.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Centralisez les clients, les séances, les contenus et l’IA pour gagner du temps, renforcer la relation et développer votre activité.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                  Lancer une séance
                </button>
                <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-400/40 hover:text-amber-300">
                  Voir les programmes
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Rituels</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Streak & motivation</h3>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300">
                  +12 XP
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {streaks.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/5 bg-slate-900/80 p-4">
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <article
                key={module.id}
                id={module.id}
                className={`rounded-[28px] border border-white/10 bg-gradient-to-br ${module.accent} p-[1px]`}
              >
                <div className="h-full rounded-[27px] border border-white/10 bg-slate-950/90 p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{module.eyebrow}</div>
                  <h3 className="mt-3 text-xl font-semibold text-white">{module.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{module.description}</p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-300">
                    {module.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div id="ia" className="rounded-[28px] border border-white/10 bg-slate-950/80 p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Priorités du moment</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Ce qui mérite votre attention</h3>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  IA proactive
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {priorities.map((item) => (
                  <li key={item} className="rounded-2xl border border-white/5 bg-slate-900/80 p-4">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div id="marketplace" className="rounded-[28px] border border-white/10 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Monétisation</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Marketplace & ventes</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Proposez des offres 1:1, packs et abonnements, avec un tunnel de vente clair et des notifications en temps réel à chaque vente.
              </p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Offres actives</span>
                  <span className="font-semibold text-white">4 packs</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Revenus du mois</span>
                  <span className="font-semibold text-amber-300">+27%</span>
                </div>
              </div>
            </div>
          </section>

          <section id="settings" className="rounded-[28px] border border-white/10 bg-slate-950/80 p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Paramètres</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Votre espace reste propre, rapide et personnalisable.</h3>
              </div>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-400/40 hover:text-amber-300">
                Gérer mon profil
              </button>
            </div>
          </section>
        </div>
      </ErpShell>
    </ErpAuthGuard>
  );
}
