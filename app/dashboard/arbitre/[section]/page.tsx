import {
  redirectWithSearchParams,
  type RouteSearchParams,
} from "@/app/_routing/redirect-with-search-params";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: RouteSearchParams;
}) {
  const { section } = await params;

  return redirectWithSearchParams(
    `/dashboard/officiel/${encodeURIComponent(section)}`,
    searchParams,
  );
}
