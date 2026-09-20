import { LegacyJudgeRedirect } from "@/modules/officials/components/LegacyJudgeRedirect";

export default async function Page({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  return <LegacyJudgeRedirect target={`/dashboard/officiel/messages/${conversationId}`} />;
}
