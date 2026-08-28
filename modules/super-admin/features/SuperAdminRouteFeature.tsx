import {
  notFound,
} from "next/navigation";

import {
  SuperAdminAccessLogsFeature,
} from "./SuperAdminAccessLogsFeature";

import {
  SuperAdminAdministratorsFeature,
} from "./SuperAdminAdministratorsFeature";

import {
  SuperAdminAnalyticsSectionFeature,
} from "./SuperAdminAnalyticsSectionFeature";

import {
  SuperAdminBusinessFeature,
} from "./SuperAdminBusinessFeature";

import {
  SuperAdminMarketplaceFeature,
} from "./SuperAdminMarketplaceFeature";

import {
  SuperAdminPerformanceFeature,
} from "./SuperAdminPerformanceFeature";

import {
  SuperAdminPermissionsFeature,
} from "./SuperAdminPermissionsFeature";

import {
  SuperAdminSystemObservabilityFeature,
} from "./SuperAdminSystemObservabilityFeature";

import type {
  SuperAdminAnalyticsSection,
} from "../types";


const analyticsSections =
  new Set<SuperAdminAnalyticsSection>([
    "growth",
    "users",
    "sport",
    "community",
    "organizations",
    "geography",
  ]);


export function SuperAdminRouteFeature({
  section,
}: {
  section: string;
}) {

  if (
    section ===
    "business"
  ) {

    return (
      <SuperAdminBusinessFeature />
    );
  }


  if (
    section ===
    "marketplace"
  ) {

    return (
      <SuperAdminMarketplaceFeature />
    );
  }


  if (
    section ===
    "performance"
  ) {

    return (
      <SuperAdminPerformanceFeature />
    );
  }


  if (
    section ===
    "system"
  ) {

    return (
      <SuperAdminSystemObservabilityFeature />
    );
  }


  if (
    analyticsSections.has(
      section as SuperAdminAnalyticsSection,
    )
  ) {

    return (
      <SuperAdminAnalyticsSectionFeature
        section={
          section as SuperAdminAnalyticsSection
        }
      />
    );
  }


  if (
    section ===
    "administrators"
  ) {

    return (
      <SuperAdminAdministratorsFeature />
    );
  }


  if (
    section ===
    "permissions"
  ) {

    return (
      <SuperAdminPermissionsFeature />
    );
  }


  if (
    section ===
    "access-logs"
  ) {

    return (
      <SuperAdminAccessLogsFeature />
    );
  }


  notFound();
}