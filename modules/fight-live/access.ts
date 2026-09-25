import type {
  FightLiveCapabilities,
  FightLiveMode,
  FightLiveOfficial,
  RoleLiveRole,
} from "./types";

const viewerCapabilities: FightLiveCapabilities = {
  accessMode: "public-viewer",
  canViewPublicLive: true,
  canViewOperationalLive: false,
  canControlTimer: false,
  canRecordOfficialAction: false,
  canScoreJudgeCard: false,
  canDecideFight: false,
  canPublishResult: false,
  canRecalculateStatistics: false,
};

const managerCapabilities: FightLiveCapabilities = {
  accessMode: "platform-manager",
  canViewPublicLive: true,
  canViewOperationalLive: true,
  canControlTimer: false,
  canRecordOfficialAction: false,
  canScoreJudgeCard: false,
  canDecideFight: true,
  canPublishResult: true,
  canRecalculateStatistics: true,
};

const roleLiveRoles = new Set<RoleLiveRole>([
  "admin", "super-admin", "club", "coach", "fan",
  "federation", "league", "seller", "sponsor",
]);

export function isRoleLiveRole(role: string): role is RoleLiveRole {
  return roleLiveRoles.has(role as RoleLiveRole);
}

export function resolveRoleLiveCapabilities(
  role: RoleLiveRole,
): FightLiveCapabilities {
  return role === "admin" || role === "super-admin"
    ? managerCapabilities
    : viewerCapabilities;
}

export function resolveFightLiveCapabilities(
  mode: FightLiveMode,
  assignedRoles: FightLiveOfficial["role"][] = [],
): FightLiveCapabilities {
  if (mode === "public") return viewerCapabilities;
  if (mode === "admin") return managerCapabilities;
  if (mode === "fighter") {
    return {
      ...viewerCapabilities,
      accessMode: "authorized-participant",
      canViewOperationalLive: true,
    };
  }

  if (mode === "organizer") {
    return {
      ...managerCapabilities,
      accessMode: "organizer-manager",
      canControlTimer: true,
      canRecordOfficialAction: true,
    };
  }

  if (mode === "judge") {
    const assigned = assignedRoles.includes("judge");
    return {
      ...viewerCapabilities,
      accessMode: "assigned-judge",
      canViewOperationalLive: assigned,
      canScoreJudgeCard: assigned,
    };
  }

  const canControlTimer = assignedRoles.some(
    (role) => role === "referee" || role === "timekeeper",
  );
  const canRecordOfficialAction = assignedRoles.some((role) =>
    ["referee", "timekeeper", "doctor", "supervisor"].includes(role),
  );

  return {
    ...viewerCapabilities,
    accessMode: "assigned-official",
    canViewOperationalLive: canControlTimer || canRecordOfficialAction,
    canControlTimer,
    canRecordOfficialAction,
  };
}
