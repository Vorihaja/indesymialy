import { AdminDetailFeature } from "@/modules/admin";
export default async function Page({ params }: { params: Promise<{ section: string; id: string }> }) { const { section, id } = await params; return <AdminDetailFeature section={section} id={id} access="admin" />; }
