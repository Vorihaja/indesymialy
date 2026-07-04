"use client";
import ErpShell from "../ErpShell";
import ErpAuthGuard from "../ErpAuthGuard";

export default function ArbitreDashboardPage() {
  const stats = [
    { label: "Matchs supervisés", value: "8", note: "Toute la saison est planifiée." },
    { label: "Feuilles validées", value: "24", note: "Normes fédérales respectées." },
    { label: "Alertes reçues", value: "3", note: "Notifications en temps réel." },
    { label: "Missions à venir", value: "2", note: "Prochaines compétitions assignées." },
  ];

  const assignments = [
    { event: "MAHAJANGA FIGHT NIGHT", role: "Table de contrôle", date: "12 juil." },
    { event: "INDESY MIALY GALA II", role: "Ring chief", date: "20 sept." },
  ];

  return (
    <ErpAuthGuard>
      <ErpShell
        title="Espace arbitre"
        subtitle="Gérez vos convocations, rapports et missions officielles avec un tableau de bord clair."
        stats={stats}
        actions={
          <button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition">
            Voir agenda
          </button>
        }
        sidebarTopItems={[
          { id: "dashboard", label: "Dashboard", href: "#dashboard" }
        ]}
        sidebarBottomItems={[
          { id: "missions", label: "Missions assignées", href: "#missions" },
          { id: "agenda", label: "Agenda", href: "#agenda" },
        ]}
      >
        <div id="dashboard" className="space-y-10">

          <section id="missions" className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Missions assignées</h2>
                <p className="text-sm text-slate-400">
                  Suivi des prochaines commissions et rencontres.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {assignments.map((item) => (
                <div
                  key={item.event}
                  className="rounded-3xl border border-white/5 bg-slate-900/80 p-4"
                >
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                    {item.role}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {item.event}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">{item.date}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="agenda"
            className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 mt-6"
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">
                Agenda des missions
              </h3>
              <p className="text-sm text-slate-400">
                Suivez les prochaines interventions et horaires.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">
                <p className="text-sm text-slate-300">
                  12 juillet - Match central
                </p>
                <p className="text-sm text-slate-400">
                  Table de contrôle, validation de feuille.
                </p>
              </div>

              <div className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">
                <p className="text-sm text-slate-300">
                  20 septembre - Gala II
                </p>
                <p className="text-sm text-slate-400">
                  Supervision des arbitres ring chief.
                </p>
              </div>
            </div>
          </section>

        </div>
      </ErpShell>
    </ErpAuthGuard>
  );
}