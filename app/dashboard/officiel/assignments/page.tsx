import {
  RoleGuard,
} from "@/modules/auth/guards";
import {
  OfficialAssignmentsFeature,
} from "@/modules/officials/assignments";

export default function Page() {
  return (
    <RoleGuard role="official">
      <OfficialAssignmentsFeature tab="À venir" />
    </RoleGuard>
  );
}
