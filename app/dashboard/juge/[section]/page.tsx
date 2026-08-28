import { WorkspaceRoutePage } from "@/modules/platform-workspaces/features/WorkspaceRoutePage";
export default async function Page({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; return <WorkspaceRoutePage role="judge" section={section} />; }
