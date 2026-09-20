import {
  redirectWithSearchParams,
  type RouteSearchParams,
} from "@/app/_routing/redirect-with-search-params";

export default function Page({ searchParams }: { searchParams: RouteSearchParams }) {
  return redirectWithSearchParams(
    "/dashboard/officiel/licenses",
    searchParams,
  );
}
