import {
  RoleGuard,
} from "@/modules/auth/guards";
import {
  MessagingFeature,
} from "@/modules/communication-core/features/CommunicationFeatures";

export default async function Page({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <RoleGuard role="official">
      <MessagingFeature
        conversationId={conversationId}
        role="official"
        basePath="/dashboard/officiel/messages"
      />
    </RoleGuard>
  );
}
