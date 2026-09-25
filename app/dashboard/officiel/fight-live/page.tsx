import {
  RoleGuard,
} from "@/modules/auth/guards";
import {
  FightLiveListFeature,
} from "@/modules/fight-live";

export default function Page() {
  return (
    <RoleGuard role="official">
      <FightLiveListFeature
        mode="referee"
        basePath="/dashboard/officiel/fight-live"
      />
    </RoleGuard>
  );
}
