import { RoleGuard } from "@/modules/auth/guards";
import { SellerDashboardFeature } from "@/modules/seller-dashboard";

export default function Page() {
  return (
    <RoleGuard role="seller">
      <SellerDashboardFeature />
    </RoleGuard>
  );
}
