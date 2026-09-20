import {
  redirectWithSearchParams,
  type RouteSearchParams,
} from "@/app/_routing/redirect-with-search-params";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: RouteSearchParams;
}) {
  const { conversationId } = await params;

  return redirectWithSearchParams(
    `/dashboard/officiel/messages/${encodeURIComponent(conversationId)}`,
    searchParams,
  );
}
