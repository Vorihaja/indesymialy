import { notFound } from "next/navigation";
import { WorkspaceSectionPage } from "./WorkspaceSectionPage";
import { WORKSPACE_SECTIONS, type WorkspaceRole, type WorkspaceSection } from "../types";

export function WorkspaceRoutePage({ role, section }: { role: WorkspaceRole; section: string }) {
  if (!WORKSPACE_SECTIONS.includes(section as WorkspaceSection)) notFound();
  return <WorkspaceSectionPage role={role} section={section as WorkspaceSection} />;
}
