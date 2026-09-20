import { LegacyJudgeRedirect } from "@/modules/officials/components/LegacyJudgeRedirect";

export default async function Page({
  params,
}: {
  params: Promise<{ fightId: string }>;
}) {
  const { fightId } = await params;

  return (
    <LegacyJudgeRedirect
      target={`/dashboard/officiel/scorecards/${fightId}`}
    />
  );
}
