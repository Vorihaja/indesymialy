import { LegacyJudgeRedirect } from "@/modules/officials/components/LegacyJudgeRedirect";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LegacyJudgeRedirect target={`/dashboard/officiel/management/${id}`} />;
}
