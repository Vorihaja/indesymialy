import {
  WorkspaceRoutePage,
} from "@/modules/platform-workspaces/features/WorkspaceRoutePage";
import { UniversalErpPrototype } from "@/modules/universal-erp";
import { OfficialScorecardsRoute } from "@/modules/officials/scorecards";

const OFFICIAL_MODULE_SECTIONS = new Set([
  "fights",
  "training",
  "evaluations",
  "marketplace",
]);

export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (section === "scorecards") {
    return <OfficialScorecardsRoute />;
  }

  if (OFFICIAL_MODULE_SECTIONS.has(section)) {
    return (
      <UniversalErpPrototype
        role="official"
        initialModule={section}
      />
    );
  }

  return (
    <WorkspaceRoutePage
      role="official"
      section={section}
    />
  );
}
