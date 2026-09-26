import {
  AuthenticatedCommunicationGuard,
} from "@/modules/communication-core/components/AuthenticatedCommunicationGuard";

import {
  KoranaRequestsFeature,
} from "@/modules/korana/features/KoranaRequestsFeature";

export default function KoranaRequestsPage() {
  return (
    <AuthenticatedCommunicationGuard embedded>
      <KoranaRequestsFeature />
    </AuthenticatedCommunicationGuard>
  );
}