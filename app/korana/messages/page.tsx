import {
  AuthenticatedCommunicationGuard,
} from "@/modules/communication-core/components/AuthenticatedCommunicationGuard";

import {
  MessagingFeature,
} from "@/modules/communication-core/features/CommunicationFeatures";


export default function KoranaMessagesPage() {

  return (
    <div className="dark h-full min-h-0 min-w-0 overflow-hidden">
      <AuthenticatedCommunicationGuard
        embedded
      >

        <div className="h-full min-h-0 min-w-0 overflow-hidden">

          <MessagingFeature
            embedded
            basePath="/korana/messages"
          />

        </div>

      </AuthenticatedCommunicationGuard>
    </div>
  );
}
