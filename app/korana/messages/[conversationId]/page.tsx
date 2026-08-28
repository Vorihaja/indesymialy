import {
  AuthenticatedCommunicationGuard,
} from "@/modules/communication-core/components/AuthenticatedCommunicationGuard";

import {
  MessagingFeature,
} from "@/modules/communication-core/features/CommunicationFeatures";


export default async function KoranaConversationPage({
  params,
}: {
  params: Promise<{
    conversationId: string;
  }>;
}) {

  const {
    conversationId,
  } =
    await params;


  return (
    <div className="dark h-full min-h-0 min-w-0 overflow-hidden">
      <AuthenticatedCommunicationGuard
        embedded
      >

        <div className="h-full min-h-0 min-w-0 overflow-hidden">

          <MessagingFeature
            embedded
            conversationId={
              conversationId
            }
            basePath="/korana/messages"
          />

        </div>

      </AuthenticatedCommunicationGuard>
    </div>
  );
}
