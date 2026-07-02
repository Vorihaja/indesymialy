"use client";
import ErpShell from "../ErpShell";
import ErpAuthGuard from "../ErpAuthGuard";

export default function FanDashboardPage() {
  const stats = [
    { label: "Événements suivis", value: "7", note: "Couverture en temps réel assurée." },
    { label: "Notifications", value: "14", note: "Alertes pour vos combattants favoris." },
    { label: "Offres VIP", value: "3", note: "Billets premium disponibles." },
    { label: "Ressources média", value: "24", note: "Vidéos et interviews prêtes." },
  ];

  const events = [
    { title: "MAHAJANGA FIGHT NIGHT", date: "12 juillet 2026", venue: "Mahajanga", status: "Bientôt" },
    { title: "INDESY MIALY GALA II", date: "20 septembre 2026", venue: "Antananarivo", status: "Planifié" },
    { title: "BOENY COMBAT CHALLENGE", date: "05 novembre 2026", venue: "Mahajanga", status: "Préparation" },
  ];

  return (
    <ErpAuthGuard>
      <ErpShell
        title="Espace fan"
        subtitle="Accédez aux événements, contenus exclusifs et alertes de vos favoris."
        stats={stats}
        actions={<button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition">Voir la billetterie</button>}
        sidebarTopItems={[{ id: 'dashboard', label: 'Dashboard', href: '#dashboard' }]}
        sidebarBottomItems={[
          { id: 'events', label: 'Événements', href: '#events' },
          { id: 'trends', label: 'Tendances', href: '#trends' },
        ]}
      >
      <div id="dashboard" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section id="events" className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Prochains événements</h2>
            <p className="text-sm text-slate-400">Vos rendez-vous à ne pas manquer.</p>
          </div>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.title} className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{event.title}</p>
                    <p className="text-sm text-slate-400">{event.venue}</p>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-amber-300">
                    {event.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{event.date}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="trends" className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Tendances et actus</h3>
            <p className="text-sm text-slate-400">Contenus récents pour votre feed.</p>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">Interview exclusive de Miora Ratsimba après sa préparation.</div>
            <div className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">Offre early bird disponible pour le Gala II.</div>
          </div>
        </section>
      </div>
    </ErpShell>
    </ErpAuthGuard>
  );
}
