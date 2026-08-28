import Link from "next/link";

const modules = [
  [
    "Actualités",
    "Publications, médias, catégories et filtres",
    "/social/actualites",
  ],
  [
    "Discussions",
    "Sujets, réponses, mentions et verrouillage",
    "/social/discussions",
  ],
  [
    "Commentaires",
    "Commentaires, réponses et mentions J’aime",
    "/social/commentaires",
  ],
  ["Médias", "Photos, vidéos, albums et galeries", "/social/medias"],
  [
    "Recherche sociale",
    "Personnes, clubs, contenus et hashtags",
    "/social/recherche",
  ],
  [
    "Profils publics",
    "Les acteurs publics Indesy Mialy",
    "/social/profils",
  ],
] as const;

export default function Page() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="border-b border-[#303238] pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3d92ff]">
          Écosystème social
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
          Communauté Indesy Mialy
        </h1>
      </header>
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {modules.map(([title, description, href]) => (
          <Link
            href={href}
            key={href}
            className="group rounded-[2px] border border-[#303238] bg-[#151619] p-5 transition-colors hover:border-[#3d92ff]"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
              Module social
            </p>
            <h2 className="mt-2 text-lg font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {description}
            </p>
            <span className="mt-5 inline-flex text-xs font-bold text-zinc-300 transition-colors group-hover:text-white">
              Ouvrir →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
