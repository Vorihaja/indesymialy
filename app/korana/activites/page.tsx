import {
  AuthenticatedCommunicationGuard,
} from "@/modules/communication-core/components/AuthenticatedCommunicationGuard";

import {
  KoranaActivityFeature,
} from "@/modules/korana/features/KoranaActivityFeature";

export default function KoranaActivityPage() {
  return (
    <AuthenticatedCommunicationGuard embedded>
      <KoranaActivityFeature />
    </AuthenticatedCommunicationGuard>
  );
}