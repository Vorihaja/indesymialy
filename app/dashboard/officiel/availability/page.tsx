import { RoleGuard } from "@/modules/auth/guards";
import { UniversalErpPrototype } from "@/modules/universal-erp";

export default function Page() {
  return (
    <RoleGuard role="official">
      <UniversalErpPrototype role="official" initialModule="availability" />
    </RoleGuard>
  );
}
