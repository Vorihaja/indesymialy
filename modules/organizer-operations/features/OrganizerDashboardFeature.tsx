"use client";

import {
  Alert,
} from "@/components/ui";

import {
  OrganizerDashboard,
} from "../components/OrganizerDashboard";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useOrganizerDashboard,
} from "../hooks/useOrganizerOperations";

export function OrganizerDashboardFeature() {
  const {
    data,
    loading,
    error,
    switchingEvent,
    actionError,
    switchActiveEvent,
  } =
    useOrganizerDashboard();

  if (loading) {
    return (
      <IndesyDualOrbitLoader
        variant="section"
        label="Chargement du centre de contrôle"
      />
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <Alert
        tone="danger"
        title="Centre de contrôle indisponible"
      >
        {error}
      </Alert>
    );
  }

  return (
    <div className="grid gap-2">
      {actionError && (
        <Alert
          tone="warning"
          title="Événement actif"
        >
          {actionError}
        </Alert>
      )}

      <OrganizerDashboard
        snapshot={data}
        switchingEvent={
          switchingEvent
        }
        onSwitchActiveEvent={
          switchActiveEvent
        }
      />
    </div>
  );
}
