import { RoleGuard } from '@/modules/auth/guards';
import { OrganizerErpPrototype } from '@/modules/organizer-erp';

export default function OrganizerDashboardPage() {
  return <RoleGuard role='organizer'><OrganizerErpPrototype /></RoleGuard>;
}
