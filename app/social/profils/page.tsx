import Link from "next/link";

import { PublicProfilesFeature } from "@/modules/public-profiles";

const roles = [
  "combattant",
  "club",
  "coach",
  "organisateur",
  "officiel",
  "juge",
  "sponsor",
  "vendeur",
  "fan",
] as const;

export default function Page() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="rounded-[2px] border border-[#303238] bg-[#151619] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3d92ff]">
            Annuaire public
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Profils publics
          </h1>
          <nav
            aria-label="Profils par rôle"
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
          >
            {roles.map((role) => (
              <Link
                key={role}
                href={`/social/profils/${role}`}
                className="shrink-0 rounded-[2px] border border-[#303238] bg-[#101114] px-3 py-2 text-xs font-semibold capitalize text-zinc-400 transition-colors hover:border-[#3d92ff] hover:text-white"
              >
                {role}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <PublicProfilesFeature />
    </>
  );
}
