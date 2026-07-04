"use client";
import ErpShell from "../ErpShell";
import ErpAuthGuard from "../ErpAuthGuard";

export default function CombattantDashboardPage() {
  const stats = [
    { label: "Combats à venir", value: "3", note: "Programme chargé pour la saison." },
    { label: "Record actuel", value: "18-4-1", note: "Rendement haute performance." },
    { label: "Contrats signés", value: "2", note: "Partenaires et événements assurés." },
    { label: "Forme actuelle", value: "88%", note: "Préparation en cours." },
  ];

  const trainingPlan = [
    { day: "Lundi", activity: "Sparring intensif", status: "Confirmé" },
    { day: "Mercredi", activity: "Préparation cardio", status: "Planifié" },
    { day: "Vendredi", activity: "Revue tactique", status: "Confirmé" },
  ];

  return (
    <ErpAuthGuard>
      <ErpShell
        title="Espace combattant"
        subtitle="Suivez votre profil, entraînements et prochaines dates de combat."
        stats={stats}
        actions={<button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition">Nouveau combat</button>}
        sidebarTopItems={[{ id: 'dashboard', label: 'Dashboard', href: '#dashboard' }]}
        sidebarBottomItems={[
          { id: 'profil', label: 'Profil sportif', href: '#profil' },
          { id: 'plan', label: 'Plan d\'entraînement', href: '#plan' },
        ]}
      >
      <div id="dashboard" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section id="profil" className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Profil sportif</h2>
              <p className="text-sm text-slate-400">Données clés et ressources en un seul endroit.</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
              Niveau de récupération : <span className="font-semibold text-white">Très bon</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Poids", value: "76.8 kg" },
              { label: "Catégorie", value: "MMA -77 kg" },
              { label: "Club", value: "Tana Fight Club" },
              { label: "Coach", value: "M. Andriamahefa" },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl bg-slate-900/80 p-4 border border-white/5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="plan" className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-lg font-semibold text-white">Plan d&apos;entraînement</h3>
              <p className="text-sm text-slate-400">Sessions à venir cette semaine.</p>
            </div>
          </div>
          <div className="space-y-3">
            {trainingPlan.map((item) => (
              <div key={item.day} className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.day}</p>
                    <p className="text-sm text-slate-400">{item.activity}</p>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ErpShell>
    </ErpAuthGuard>
  );
}
