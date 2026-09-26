import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const requestSources = read("./requests/request-sources.ts");
const requestsFeature = read("./features/KoranaRequestsFeature.tsx");
const officialRequests = read("./features/KoranaOfficialAssignmentRequests.tsx");
const coorganizationRequests = read(
  "./features/KoranaEventCoorganizationRequests.tsx",
);
const coorganizationHook = read(
  "../organizer-erp/real-data/useEventCoorganizationRequests.ts",
);
const organizerRepository = read(
  "../organizer-erp/real-data/organizer-event-workflow.repository.ts",
);
const organizerService = read(
  "../organizer-erp/real-data/organizer-event-workflow.service.ts",
);
const organizerUseCase = read(
  "../organizer-erp/real-data/save-organizer-event-workflow.use-case.ts",
);

const organizationInvitationRequests = read(
  "./features/KoranaOrganizationInvitationRequests.tsx",
);
const organizationInvitationHook = read(
  "../identity-core/organization-invitations/hooks/useOrganizationInvitations.ts",
);
const organizationInvitationRepository = read(
  "../identity-core/organization-invitations/repositories/organization-invitation-supabase.repository.ts",
);
const organizationInvitationMigration = read(
  "../../supabase/migrations/20260926190000_organization_invitation_response_normalization.sql",
);const officialRepository = read(
  "../referees/assignments/repositories/referee-assignments-supabase.repository.ts",
);
const officialService = read(
  "../referees/assignments/services/referee-assignments.service.ts",
);
const proposalFeature = read("../communication-core/features/CommunicationFeatures.tsx");
const communicationRepository = read(
  "../communication-core/repositories/communication-supabase.repository.ts",
);
const activityFeature = read("./features/KoranaActivityFeature.tsx");
const notificationTypes = read("../communication-core/types.ts");
const notificationRepository = communicationRepository;
const databaseTypes = read("../../infrastructure/supabase/database.types.ts");
const activityProjection = read("./activities/activity-projection.mjs");

test("Korana request sources include proposals, official assignments, event coorganization and organization invitations", () => {
  const configuredSources = requestSources.split(
    "export const KORANA_REQUEST_SOURCES",
  )[1];
  const ids = [...configuredSources.matchAll(/id: "([a-z-]+)"/g)]
    .map((match) => match[1])
    .sort();

  assert.deepEqual(ids, [
    "event-coorganization",
    "fight-proposals",
    "official-assignments",
    "organization-invitations",
    "sponsor-offers",
  ]);
  assert.match(requestSources, /actionModel: "accept-refuse-counter"/);
  assert.match(requestSources, /actionModel: "confirm-decline"/);
  assert.doesNotMatch(requestSources, /domainRecord|copiedRecord|snapshot/);
});

test("proposal requests are limited to inbound private conversation messages and pending state", () => {
  assert.match(communicationRepository, /incomingPrivateMessageIds/);
  assert.match(communicationRepository, /eq\("profile_id", userId\)[\s\S]*?is\("left_at", null\)/);
  assert.match(communicationRepository, /eq\("conversation_type", "private"\)/);
  assert.match(communicationRepository, /neq\("sent_by_profile_id", userId\)/);
  assert.match(communicationRepository, /\.in\("message_id", messageIds\)/);
  assert.match(communicationRepository, /\.eq\("status", "pending"\)/);
  assert.match(proposalFeature, /items\.filter\(\(item\) => item\.status === "pending"\)/);
  assert.match(requestsFeature, /actionableOnly/);
});

test("official requests delegate scoped decisions to the existing domain hook", () => {
  assert.match(officialRequests, /useRefereeAssignments/);
  assert.match(officialRequests, /"invited"[\s\S]*"assigned"[\s\S]*"pending"/);
  assert.match(officialRequests, /respond\(item, "confirmed"\)/);
  assert.match(officialRequests, /respond\(item, "declined"\)/);
  assert.doesNotMatch(officialRequests, /\.from\(|\.rpc\(/);
  assert.match(officialRepository, /"judge"[\s\S]*"timekeeper"[\s\S]*"doctor"[\s\S]*"supervisor"[\s\S]*"announcer"/);
  assert.match(officialRepository, /\.eq\("profile_id", userId\)/);
  assert.match(officialRepository, /\.eq\("user_id", userId\)/);
  assert.match(officialService, /input\.status !== "confirmed"[\s\S]*input\.status !== "declined"/);
  assert.match(requestsFeature, /KoranaOfficialAssignmentRequests/);
});

test("event coorganization requests delegate to organizer authority and expose inbound pending invitations only", () => {
  assert.match(requestSources, /id: "event-coorganization"/);
  assert.match(requestSources, /authority: "event_coorganizers"/);
  assert.match(requestSources, /actionModel: "accept-decline"/);
  assert.match(requestSources, /renderStrategy: "event-coorganization"/);

  assert.match(requestsFeature, /KoranaEventCoorganizationRequests/);

  assert.match(coorganizationRequests, /useEventCoorganizationRequests/);
  assert.doesNotMatch(coorganizationRequests, /\.from\(|\.rpc\(/);

  assert.match(coorganizationHook, /actionableInvitations/);
  assert.match(coorganizationHook, /useCase\.respond/);
  assert.doesNotMatch(coorganizationHook, /\.from\(|\.rpc\(/);

  assert.match(organizerRepository, /list_my_event_coorganizations/);
  assert.match(organizerRepository, /item\.status === 'pending'/);
  assert.match(organizerRepository, /can_manage_organization/);
  assert.match(organizerRepository, /manageableOrganizationIds/);
  assert.match(organizerRepository, /respond_event_coorganization/);

  assert.match(organizerService, /actionableInvitations/);
  assert.match(organizerUseCase, /actionableInvitations/);

  assert.doesNotMatch(requestSources, /seller-personnel-invitations/);
});
test("organization invitation requests delegate to the canonical identity authority without a seller duplicate", () => {
  assert.match(
    requestSources,
    /id: "organization-invitations"/,
  );

  assert.match(
    requestSources,
    /authority: "organization_invitations"/,
  );

  assert.match(
    requestSources,
    /actionModel: "accept-decline"/,
  );

  assert.match(
    requestSources,
    /renderStrategy: "organization-invitations"/,
  );

  assert.match(
    requestsFeature,
    /KoranaOrganizationInvitationRequests/,
  );

  assert.match(
    organizationInvitationRequests,
    /useOrganizationInvitations/,
  );

  assert.doesNotMatch(
    organizationInvitationRequests,
    /\.from\(|\.rpc\(/,
  );

  assert.match(
    organizationInvitationHook,
    /createOrganizationInvitationUseCase/,
  );

  assert.match(
    organizationInvitationHook,
    /useCase\.listPending/,
  );

  assert.match(
    organizationInvitationHook,
    /useCase\.respond/,
  );

  assert.doesNotMatch(
    organizationInvitationHook,
    /\.from\(|\.rpc\(/,
  );

  assert.match(
    organizationInvitationRepository,
    /list_my_organization_invitations/,
  );

  assert.match(
    organizationInvitationRepository,
    /respond_organization_invitation/,
  );

  assert.match(
    organizationInvitationMigration,
    /public\.respond_organization_invitation/,
  );

  assert.doesNotMatch(
    requestSources,
    /id: "seller-personnel-invitations"/,
  );
});
test("activities are a personal system-notification projection, not the inbox", () => {
  assert.match(notificationTypes, /actionRequired\?: boolean/);
  assert.match(notificationRepository, /notificationActionRequired[\s\S]*action_required === true/);
  assert.match(notificationRepository, /\.from\([\s\S]*?"system_notifications"[\s\S]*?\.eq\([\s\S]*?"user_id"[\s\S]*?userId/);
  assert.match(activityFeature, /useNotifications\(\)/);
  assert.match(activityFeature, /projectKoranaActivities\(items\)/);
  assert.doesNotMatch(activityFeature, /NotificationsFeature|NotificationCenter/);
  assert.match(activityProjection, /"fight_live"/);
  assert.match(activityProjection, /"fight_proposal"[\s\S]*"sponsoring"[\s\S]*"event"[\s\S]*"role"/);
  assert.doesNotMatch(activityFeature, /\.from\(|\.rpc\(/);
  assert.doesNotMatch(activityProjection, /\.from\(|\.rpc\(/);
  assert.doesNotMatch(activityFeature, /\.insert\(|\.update\(|\.delete\(/);
  assert.match(databaseTypes, /system_notifications: \{/);
  assert.doesNotMatch(databaseTypes, /korana_activities:/);
});

test("action-required and request notifications stay out of activities", () => {
  assert.match(activityProjection, /notification\.actionRequired === true/);
  assert.match(activityProjection, /!isDecisionBearingNotification\(notification\)/);
  assert.match(activityFeature, /activity\.actionUrl/);
});