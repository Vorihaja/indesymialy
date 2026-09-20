import {
  LegacyJudgeRedirect,
} from "@/modules/officials/components/LegacyJudgeRedirect";

export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  return (
    <LegacyJudgeRedirect
      target={`/dashboard/officiel/${section}`}
    />
  );
}
