import Link from "next/link";

const links = [
  ["Accueil", "/social"],
  ["Actualités", "/social/actualites"],
  ["Discussions", "/social/discussions"],
  ["Commentaires", "/social/commentaires"],
  ["Réactions", "/social/reactions"],
  ["Partages", "/social/partages"],
  ["Signalements", "/social/signalements"],
  ["Médias", "/social/medias"],
  ["Recherche", "/social/recherche"],
  ["Profils", "/social/profils"],
] as const;

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#090a0c] text-white">
      <header className="border-b border-[#303238] bg-[#0d0e11] px-4 py-4">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/social"
            className="text-lg font-black uppercase tracking-tight"
          >
            Indesy Mialy <span className="text-[#ff1638]">Social</span>
          </Link>
          <nav
            aria-label="Navigation sociale"
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
          >
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-[2px] border border-[#303238] bg-[#151619] px-3 py-2 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-[#3d92ff] hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
