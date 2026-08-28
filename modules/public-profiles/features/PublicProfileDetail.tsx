import type { PublicProfileRole } from "@/modules/social-core";

const labels: Record<PublicProfileRole, string> = {
  combattant: "Combattant",
  club: "Club",
  coach: "Coach",
  organisateur: "Organisateur",
  arbitre: "Arbitre",
  juge: "Juge",
  sponsor: "Sponsor",
  vendeur: "Vendeur",
  fan: "Fan",
};

const panelClassName =
  "rounded-[2px] border border-[#303238] bg-[#151619] p-5";

export function PublicProfileDetail({
  role,
  id,
}: {
  role: PublicProfileRole;
  id: string;
}) {
  return (
    <section className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
      <header className="rounded-[2px] border border-[#303238] bg-[#151619] p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3d92ff]">
          Profil public · {labels[role]}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
          Profil {id}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Présentation publique en cours de finalisation. Cet espace accueillera
          la biographie, les informations vérifiées et les liens officiels.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-3">
        <article className={panelClassName}>
          <h2 className="text-sm font-bold text-white">Photos</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="aspect-square rounded-[2px] border border-[#303238] bg-[#101114]"
              />
            ))}
          </div>
        </article>
        <article className={panelClassName}>
          <h2 className="text-sm font-bold text-white">
            Statistiques publiques
          </h2>
          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Statistiques métier à connecter.
          </p>
        </article>
        <article className={panelClassName}>
          <h2 className="text-sm font-bold text-white">
            Dernières publications
          </h2>
          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Aucune publication publique pour le moment.
          </p>
        </article>
      </div>
    </section>
  );
}
