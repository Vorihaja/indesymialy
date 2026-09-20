import {
  RoleGuard,
} from "@/modules/auth/guards";
import {
  MessagingFeature,
} from "@/modules/communication-core/features/CommunicationFeatures";

export default function Page() {
  return (
    <RoleGuard role="official">
      <MessagingFeature
        role="official"
        basePath="/dashboard/officiel/messages"
      />
    </RoleGuard>
  );
}
