import { notFound } from 'next/navigation';
import { OrganizerSectionFeature, ORGANIZER_SECTIONS, type OrganizerSection } from '@/modules/organizer-operations';
import { WorkspaceRoutePage } from '@/modules/platform-workspaces/features/WorkspaceRoutePage';
import { WORKSPACE_SECTIONS, type WorkspaceSection } from '@/modules/platform-workspaces/types';
import { RoleGuard } from '@/modules/auth/guards';

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (ORGANIZER_SECTIONS.includes(section as OrganizerSection)) return <RoleGuard role='organizer'><OrganizerSectionFeature section={section as OrganizerSection} /></RoleGuard>;
  if (WORKSPACE_SECTIONS.includes(section as WorkspaceSection)) return <WorkspaceRoutePage role='organizer' section={section} />;
  notFound();
}
