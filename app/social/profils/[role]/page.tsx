import Link from "next/link";
import { notFound } from "next/navigation";

import {
  redirectWithSearchParams,
  type RouteSearchParams,
} from "@/app/_routing/redirect-with-search-params";
import type { PublicProfileRole } from "@/modules/social-core";

const roles: PublicProfileRole[] = [
  "combattant",
  "club",
  "coach",
  "organisateur",
  "officiel",
  "arbitre",
  "juge",
  "sponsor",
  "vendeur",
  "fan",
];

const roleLabels: Record<PublicProfileRole, string> = {
  combattant: "Combattants",
  club: "Clubs",
  coach: "Coachs",
  organisateur: "Organisateurs",
  officiel: "Officiels",
  arbitre: "Arbitres",
  juge: "Juges",
  sponsor: "Sponsors",
  vendeur: "Vendeurs",
  fan: "Fans",
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: RouteSearchParams;
}) {
  const { role } = await params;

  if (role === "arbitre") {
    return redirectWithSearchParams(
      "/social/profils/officiel",
      searchParams,
    );
  }

  if (!roles.includes(role as PublicProfileRole)) {
    notFound();
  }

  const publicRole = role as PublicProfileRole;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="rounded-[2px] border border-[#303238] bg-[#151619] p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3d92ff]">
          Annuaire public
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
          {roleLabels[publicRole]}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Les profils publics de ce rôle apparaîtront ici.
        </p>
        <Link
          href={`/social/profils/${role}/demo`}
          className="mt-5 inline-flex h-10 items-center rounded-[2px] border border-[#ff1638] bg-[#ff1638] px-4 text-xs font-bold text-white transition-colors hover:bg-[#d91d35]"
        >
          Voir une fiche exemple
        </Link>
      </div>
    </section>
  );
}
