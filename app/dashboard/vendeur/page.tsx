"use client";
import ErpShell from "../ErpShell";
import ErpAuthGuard from "../ErpAuthGuard";

export default function VendeurDashboardPage() {
  const stats = [
    { label: "Produits listés", value: "27", note: "Catalogue en ligne prêt à la vente." },
    { label: "Commandes traitées", value: "134", note: "Transactions sécurisées." },
    { label: "Chiffre d'affaires", value: "23.4M Ar", note: "Performance mensuelle." },
    { label: "Clients actifs", value: "89", note: "Acheteurs fidèles connectés." },
  ];

  const offers = [
    { title: "Pack VIP ringside", price: "450 000 Ar", status: "En ligne" },
    { title: "Merch club officiel", price: "85 000 Ar", status: "Bientôt" },
    { title: "Billet early bird", price: "120 000 Ar", status: "En ligne" },
  ];

  return (
    <ErpAuthGuard>
      <ErpShell
        title="Espace vendeur"
        subtitle="Pilotez vos offres, ventes et partenaires sur le marketplace sportif."
        stats={stats}
        actions={
          <button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition">
            Ajouter une offre
          </button>
        }
        sidebarTopItems={[
          { id: "dashboard", label: "Dashboard", href: "#dashboard" }
        ]}
        sidebarBottomItems={[
          { id: "offres", label: "Offres actives", href: "#offres" },
        ]}
      >
        <div id="dashboard" className="space-y-6">

          <section
            id="offres"
            className="rounded-3xl border border-white/10 bg-slate-950/80 p-6"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                Offres actives
              </h2>
              <p className="text-sm text-slate-400">
                Suivez vos produits et promos dans la boutique.
              </p>
            </div>

            <div className="space-y-4">
              {offers.map((offer) => (
                <div
                  key={offer.title}
                  className="rounded-3xl border border-white/5 bg-slate-900/80 p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {offer.title}
                    </p>
                    <p className="text-sm text-slate-400">
                      {offer.price}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-emerald-300">
                    {offer.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </ErpShell>
    </ErpAuthGuard>
  );
}