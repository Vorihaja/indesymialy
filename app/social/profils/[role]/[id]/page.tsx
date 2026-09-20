import { notFound } from "next/navigation";

import {
  redirectWithSearchParams,
  type RouteSearchParams,
} from "@/app/_routing/redirect-with-search-params";
import { PublicProfileDetail } from "@/modules/public-profiles/features/PublicProfileDetail";
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

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ role: string; id: string }>;
  searchParams: RouteSearchParams;
}) {
  const { role, id } = await params;

  if (role === "arbitre") {
    return redirectWithSearchParams(
      `/social/profils/officiel/${encodeURIComponent(id)}`,
      searchParams,
    );
  }

  if (!roles.includes(role as PublicProfileRole)) {
    notFound();
  }

  return (
    <PublicProfileDetail
      role={role as PublicProfileRole}
      id={id}
    />
  );
}
