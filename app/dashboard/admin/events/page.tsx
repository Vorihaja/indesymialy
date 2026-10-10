import { AdminOrganizationsFeature } from "@/modules/admin-organizations";

export default function Page() {
  return (
    <AdminOrganizationsFeature
      domain="events"
      access="admin"
    />
  );
}
