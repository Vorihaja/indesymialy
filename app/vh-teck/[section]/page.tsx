import {
  SuperAdminRouteFeature,
} from "@/modules/super-admin";

export default async function VhTeckSectionPage({
  params,
}: {
  params: Promise<{
    section: string;
  }>;
}) {
  const {
    section,
  } = await params;

  return (
    <SuperAdminRouteFeature
      section={section}
    />
  );
}
