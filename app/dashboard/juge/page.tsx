"use client";
import ErpShell from "../ErpShell";
import ErpAuthGuard from "../ErpAuthGuard";

export default function JugeDashboardPage() {
  const stats = [
    { label: "Missions récentes", value: "5", note: "Notation réalisée avec précision." },
    { label: "Matchs planifiés", value: "8", note: "Calendrier validé par la ligue." },
    { label: "Rapports reçus", value: "12", note: "Retour rapide des arbitres." },
    { label: "Validations", value: "99%", note: "Conformité des feuilles de score." },
  ];

  const missions = [
    { bout: "Maha Fight Night", role: "Chef de plateau", date: "12 juillet" },
    { bout: "Gala II", role: "Inspecteur", date: "20 septembre" },
  ];

  return (
    <ErpAuthGuard>
      <ErpShell
        title="Espace juge"
        subtitle="Gérez vos feuilles de notation, missions et retours officiels sur les compétitions."
        stats={stats}
        actions={<button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition">Créer un rapport</button>}
        sidebarTopItems={[{ id: 'dashboard', label: 'Dashboard', href: '#dashboard' }]}
        sidebarBottomItems={[
          { id: 'missions', label: 'Missions', href: '#missions' },
          { id: 'normes', label: 'Normes officielles', href: '#normes' },
        ]}
      >
      <div id="dashboard" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section id="missions" className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Missions à venir</h2>
            <p className="text-sm text-slate-400">Planning des prochaines interventions.</p>
          </div>
          <div className="space-y-4">
            {missions.map((mission) => (
              <div key={mission.bout} className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{mission.bout}</p>
                    <p className="text-sm text-slate-400">{mission.role}</p>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-amber-300">
                    {mission.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="normes" className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Normes officielles</h3>
            <p className="text-sm text-slate-400">Points de contrôle pour chaque combat.</p>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">Vérifier les licences des combattants avant pesée.</li>
            <li className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">Mettre à jour les fiches de notation en temps réel.</li>
            <li className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">Confirmer la conformité des gants et protections.</li>
          </ul>
        </section>
      </div>
    </ErpShell>
    </ErpAuthGuard>
  );
}
