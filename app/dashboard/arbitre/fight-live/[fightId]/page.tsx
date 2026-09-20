import {
  redirectWithSearchParams,
  type RouteSearchParams,
} from "@/app/_routing/redirect-with-search-params";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ fightId: string }>;
  searchParams: RouteSearchParams;
}) {
  const { fightId } = await params;

  return redirectWithSearchParams(
    `/dashboard/officiel/fight-live/${encodeURIComponent(fightId)}`,
    searchParams,
  );
}
