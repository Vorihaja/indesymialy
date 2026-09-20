import {
  redirectWithSearchParams,
  type RouteSearchParams,
} from "@/app/_routing/redirect-with-search-params";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: RouteSearchParams;
}) {
  const { id } = await params;

  return redirectWithSearchParams(
    `/dashboard/officiel/management/${encodeURIComponent(id)}`,
    searchParams,
  );
}
