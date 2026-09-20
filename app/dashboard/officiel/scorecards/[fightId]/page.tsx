import { OfficialScorecardsRoute } from "@/modules/officials/scorecards";

export default async function Page({
  params,
}: {
  params: Promise<{ fightId: string }>;
}) {
  const { fightId } = await params;
  return <OfficialScorecardsRoute fightId={fightId} />;
}
