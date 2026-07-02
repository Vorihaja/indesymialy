"use client";
import ErpShell from "../ErpShell";
import ErpAuthGuard from "../ErpAuthGuard";

export default function ClubDashboardPage() {
  const stats = [
    { label: "Membres actifs", value: "124", note: "Licence à jour, compétitions prêtes." },
    { label: "Licences validées", value: "98%", note: "Très bonne conformité fédérale." },
    { label: "Matchs programmés", value: "11", note: "Saison prochaine en préparation." },
    { label: "Coach mobilisés", value: "5", note: "Encadrement technique complet." },
  ];

  const clubs = [
    { name: "Atsimondrano MMA Team", leaders: "S. Ranarijaona", licence: "Actif" },
    { name: "Tana Fight Club", leaders: "M. Andriamihaja", licence: "Actif" },
    { name: "Majunga Sika Club", leaders: "A. Rasoanaivo", licence: "Renouvellement" },
  ];

  return (
    <ErpAuthGuard>
      <ErpShell
        title="Espace club"
        subtitle="Gérez les effectifs, les licences et la préparation de vos compétitions."
        sidebarTopItems={[{ id: 'dashboard', label: 'Dashboard', href: '#dashboard' }]}
        sidebarBottomItems={[
          { id: 'clubs', label: 'Clubs clés', href: '#clubs' },
          { id: 'performance', label: 'Performance', href: '#performance' },
        ]}
      >
        <div id="dashboard" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section id="clubs" className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Clubs clés</h2>
              <p className="text-sm text-slate-400">Suivi des structures partenaires.</p>
            </div>
            <button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
              Ajouter un club
            </button>
          </div>
          <div className="space-y-3">
            {clubs.map((club) => (
              <div key={club.name} className="rounded-3xl bg-slate-900/80 p-4 border border-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{club.name}</p>
                    <p className="text-sm text-slate-400">Responsable : {club.leaders}</p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                    {club.licence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="performance" className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Performance du club</h3>
            <p className="text-sm text-slate-400">Rendez-vous et actions prioritaires.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm uppercase text-slate-500">Prochain entraînement</p>
              <p className="mt-3 text-2xl font-black text-white">Sam 05 juillet</p>
              <p className="mt-2 text-sm text-slate-400">Salle principale - 14h30</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm uppercase text-slate-500">Actions urgentes</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Relancer 5 licences expirées</li>
                <li>Valider 2 nouvelles adhésions</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </ErpShell>
    </ErpAuthGuard>
  );
}
