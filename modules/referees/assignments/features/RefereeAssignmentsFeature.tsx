"use client";

import {
  RefereeAssignmentsWorkspace,
} from "../components/RefereeAssignmentsWorkspace";

export function RefereeAssignmentsFeature({
  tab = "À venir",
}: {
  tab?: string;
}) {
  return (
    <RefereeAssignmentsWorkspace
      tab={tab}
    />
  );
}