import Link from "next/link";

export default function MarketplacePage() {
  const categories = [
    { title: "Équipements", description: "Gants, protections et accessoires pour combattants.", href: "/marketplace#equipements" },
    { title: "Billetterie", description: "Offres de billets et packages VIP pour les événements.", href: "/marketplace#billetterie" },
    { title: "Partenariats", description: "Services pour sponsors, clubs et organisateurs.", href: "/marketplace#partenariats" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <h1 className="text-4xl font-semibold">Marketplace</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Découvrez les offres pour combattants, organisateurs, sponsors et clubs. Achetez, proposez des services ou trouvez des partenaires locaux.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {categories.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-[1.75rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/10"
              >
                <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-3 text-slate-300">{item.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-300">Voir plus →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
