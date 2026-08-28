import { RoleGuard } from '@/modules/auth/guards';
import { UniversalErpPrototype } from '@/modules/universal-erp';

export default function Page() {
  return <RoleGuard role='judge'><UniversalErpPrototype role='judge' /></RoleGuard>;
}
