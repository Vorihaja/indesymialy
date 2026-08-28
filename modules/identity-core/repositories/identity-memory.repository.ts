import type {
  IdentityRepository,
  RegistrationProfile,
} from "./identity.repository";
import type {
  AccountPreferences,
  IdentityOrganization,
  IdentityRole,
  IdentityRoleRequest,
  IdentitySnapshot,
  OnboardingDraft,
  PrivateProfile,
  RoleAssignmentOutcome,
} from "../types";
import { isControlledIdentityRole, isFlexibleIdentityRole } from "../role-policy";
const profile: PrivateProfile = {
  id: "profile-current",
  fullName: "",
  username: "",
  email: "",
  regionId: "region-analamanga",
  cityId: "city-antananarivo",
  disciplineIds: [],
  primaryRole: null,
  secondaryRoles: [],
  status: "active",
  onboardingComplete: false,
};
let draft: OnboardingDraft = {
  profile,
  roleData: {},
  documentsPrepared: [],
  acceptedTerms: false,
  updatedAt: new Date().toISOString(),
};
const requests: IdentityRoleRequest[] = [];
const organizations: IdentityOrganization[] = [
  {
    id: "organization-personal",
    name: "Espace personnel",
    type: "personal",
    description: "Organisation personnelle",
    ownerId: profile.id,
    disciplines: [],
    status: "active",
    members: [{ profileId: profile.id, role: "owner", status: "active" }],
    invitationsPrepared: [],
    internalRolesPrepared: [],
  },
];
let activeOrganizationId = "organization-personal";
let preferences: AccountPreferences = {
  theme: "system",
  language: "fr",
  emailPrepared: true,
  pushPrepared: false,
  profileVisibility: "public",
  discoverable: true,
  dataExportPrepared: true,
  deletionPrepared: true,
};
const roles = [
  ["fan", "Fan", false],
  ["fighter", "Combattant", false],
  ["coach", "Coach", false],
  ["club", "Club", false],
  ["organizer", "Organisateur", false],
  ["referee", "Arbitre", false],
  ["judge", "Juge", false],
  ["sponsor", "Sponsor", false],
  ["seller", "Vendeur", false],
  ["federation", "Fédération", true],
  ["league", "Ligue", true],
] as const;
function copy<T>(value: T): T {
  return structuredClone(value);
}
export class IdentityMemoryRepository implements IdentityRepository {

  async completeRegistration(input: RegistrationProfile): Promise<RoleAssignmentOutcome> {
    const role = isControlledIdentityRole(input.role) ? "fan" : input.role;
    draft = copy({
      ...draft,
      acceptedTerms: true,
      profile: {
        ...draft.profile,
        fullName: input.fullName,
        email: input.email,
        username: input.email.split("@")[0],
        primaryRole: role,
        regionId: input.regionId,
        cityId: input.cityId,
        onboardingComplete: false,
      },
      updatedAt: new Date().toISOString(),
    });
    if (isControlledIdentityRole(input.role)) {
      await this.createRoleRequest({
        role: input.role,
        reason: "Demande créée lors de l'inscription.",
        justificationsPrepared: [],
      });
      return { kind: "pending", role: input.role };
    }
    return { kind: "assigned", role: input.role };
  }
  async completePendingRegistration(): Promise<RoleAssignmentOutcome | null> {
    return null;
  }
  async snapshot(): Promise<IdentitySnapshot> {
    return copy({
      draft,
      roleRequests: requests,
      organizations,
      activeOrganizationId,
      preferences,
      sessions: [
        {
          id: "session-current",
          device: "Navigateur actuel",
          location: "Antananarivo",
          lastActiveAt: new Date().toISOString(),
          current: true,
          revocationPrepared: false,
        },
        {
          id: "session-mobile",
          device: "Mobile",
          location: "Mahajanga",
          lastActiveAt: "2026-08-01T10:00:00Z",
          current: false,
          revocationPrepared: true,
        },
      ],
      availableRoles: roles.map(([role, label, requiresApproval]) => ({
        role,
        label,
        requiresApproval,
      })),
      disciplines: [
        { id: "discipline-mma", name: "MMA" },
        { id: "discipline-moraingy", name: "Moraingy" },
        { id: "discipline-judo", name: "Judo" },
        { id: "discipline-muay-thai", name: "Muay Thai" },
        { id: "discipline-kickboxing", name: "Kickboxing" },
      ],
      regions: [
        { id: "region-analamanga", name: "Analamanga" },
        { id: "region-boeny", name: "Boeny" },
      ],
      cities: [
        {
          id: "city-antananarivo",
          name: "Antananarivo",
          regionId: "region-analamanga",
        },
        { id: "city-mahajanga", name: "Mahajanga", regionId: "region-boeny" },
      ],
    });
  }
  async saveDraft(value: OnboardingDraft) {
    draft = copy({ ...value, updatedAt: new Date().toISOString() });
    return copy(draft);
  }
  async completeOnboarding() {
    draft.profile.onboardingComplete = true;
    return copy(draft.profile);
  }
  async updateProfile(patch: Partial<PrivateProfile>) {
    draft.profile = { ...draft.profile, ...copy(patch), id: draft.profile.id };
    return copy(draft.profile);
  }
  async createRoleRequest(
    input: Pick<
      IdentityRoleRequest,
      "role" | "reason" | "justificationsPrepared"
    >,
  ) {
    if (!isControlledIdentityRole(input.role))
      throw new Error("ACCESS_DENIED");
    const request: IdentityRoleRequest = {
      id: "role-request-" + Date.now(),
      profileId: draft.profile.id,
      ...input,
      status: "pending",
      history: [{ status: "pending", at: new Date().toISOString() }],
      notificationPrepared: true,
      createdAt: new Date().toISOString(),
    };
    requests.unshift(request);
    return copy(request);
  }
  async assignFlexibleRole(
    role: IdentityRole,
    options: { makePrimary?: boolean } = {},
  ): Promise<RoleAssignmentOutcome> {
    if (!isFlexibleIdentityRole(role)) throw new Error("ACCESS_DENIED");
    const assigned = [draft.profile.primaryRole, ...draft.profile.secondaryRoles].includes(role);
    if (assigned) return { kind: "already_assigned", role };
    if (options.makePrimary) {
      if (draft.profile.primaryRole) draft.profile.secondaryRoles.push(draft.profile.primaryRole);
      draft.profile.primaryRole = role;
    } else {
      draft.profile.secondaryRoles.push(role);
    }
    return { kind: "assigned", role };
  }
  async createOrganization(
    input: Omit<IdentityOrganization, "id" | "ownerId" | "members" | "status">,
  ) {
    const organization: IdentityOrganization = {
      ...copy(input),
      id: "organization-" + Date.now(),
      ownerId: draft.profile.id,
      status:
        input.type === "federation" || input.type === "league"
          ? "pending"
          : "active",
      members: [
        { profileId: draft.profile.id, role: "owner", status: "active" },
      ],
    };
    organizations.unshift(organization);
    return copy(organization);
  }
  async updateOrganization(
    id: string,
    patch: Partial<
      Pick<
        IdentityOrganization,
        | "name"
        | "description"
        | "regionId"
        | "cityId"
        | "email"
        | "phone"
        | "website"
        | "disciplines"
      >
    >,
  ) {
    const index = organizations.findIndex(
      (item) => item.id === id && item.ownerId === draft.profile.id,
    );
    if (index < 0) throw new Error("ACCESS_DENIED");
    organizations[index] = { ...organizations[index], ...copy(patch) };
    return copy(organizations[index]);
  }
  async setActiveOrganization(id: string) {
    if (
      !organizations.some(
        (item) =>
          item.id === id &&
          item.members.some((member) => member.profileId === draft.profile.id),
      )
    )
      throw new Error("ACCESS_DENIED");
    activeOrganizationId = id;
  }
  async savePreferences(value: AccountPreferences) {
    preferences = copy(value);
    return copy(preferences);
  }
}
