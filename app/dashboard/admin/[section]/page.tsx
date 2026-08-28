import { AdminRouteFeature } from "@/modules/admin";
export default async function Page({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; return <AdminRouteFeature access="admin" section={section} />; }
