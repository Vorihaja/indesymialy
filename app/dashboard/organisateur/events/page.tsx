import { RoleGuard } from "@/modules/auth/guards";
import { OrganizerErpPrototype } from "@/modules/organizer-erp";

export default function Page() {
  return <RoleGuard role="organizer"><OrganizerErpPrototype initialModule="events" /></RoleGuard>;
}