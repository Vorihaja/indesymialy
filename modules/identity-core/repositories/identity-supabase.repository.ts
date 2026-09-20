import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { BackendError, normalizeBackendError } from "@/shared/errors/backend-error";
import { IdentityMemoryRepository } from "./identity-memory.repository";
import type {
  AccountPreferences,
  IdentityOrganization,
  IdentityRole,
  IdentityRoleRequest,
  IdentitySnapshot,
  OnboardingDraft,
  PrivateProfile,
  RoleAssignmentOutcome,
  RoleRequestStatus,
} from "../types";
import type { RegistrationProfile } from "./identity.repository";
import { getPrimaryIdentityRole } from "../routing";
import {
  isControlledIdentityRole,
  isFlexibleIdentityRole,
  isPublicIdentityRole,
  type PublicIdentityRole,
} from "../role-policy";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationMemberRow = Database["public"]["Tables"]["organization_members"]["Row"];
type RoleRequestRow = Database["public"]["Tables"]["role_requests"]["Row"];
type RoleRequestHistoryRow = Database["public"]["Tables"]["role_request_history"]["Row"];
type RoleRequestDocumentRow = Database["public"]["Tables"]["role_request_documents"]["Row"];
type AccountPreferencesRow = Database["public"]["Tables"]["account_preferences"]["Row"];

const identityRoles = new Set<IdentityRole>([
  "super_admin", "admin", "federation", "league", "club", "coach", "fighter",
  "organizer", "official", "referee", "judge", "sponsor", "seller", "fan",
]);

function asIdentityRole(value: string | undefined): IdentityRole | null {
  return value && identityRoles.has(value as IdentityRole) ? value as IdentityRole : null;
}

const roleRequestStatuses = new Set<RoleRequestStatus>([
  "pending", "approved", "rejected", "suspended", "withdrawn",
]);

function asRoleRequestStatus(value: string): RoleRequestStatus {
  return roleRequestStatuses.has(value as RoleRequestStatus)
    ? value as RoleRequestStatus
    : "pending";
}

function organizationType(value: string): IdentityOrganization["type"] {
  return ["personal", "club", "organizer", "sponsor", "seller", "federation", "league"].includes(value)
    ? value as IdentityOrganization["type"]
    : "personal";
}

function organizationStatus(value: string | null): IdentityOrganization["status"] {
  return ["draft", "pending", "active", "suspended"].includes(value ?? "")
    ? value as IdentityOrganization["status"]
    : "draft";
}

function profileStatus(value: string | null): PrivateProfile["status"] {
  return ["active", "suspended", "pending"].includes(value ?? "")
    ? value as PrivateProfile["status"]
    : "pending";
}


const defaultAccountPreferences: AccountPreferences = {
  theme: "system",
  language: "fr",
  emailPrepared: true,
  pushPrepared: false,
  profileVisibility: "public",
  discoverable: true,
  dataExportPrepared: false,
  deletionPrepared: false,
};


function accountTheme(
  value: string | null | undefined,
): AccountPreferences["theme"] {

  return value === "light" ||
    value === "dark" ||
    value === "system"
      ? value
      : "system";
}


function profileVisibility(
  value: string | null | undefined,
): AccountPreferences["profileVisibility"] {

  return value === "members" ||
    value === "private" ||
    value === "public"
      ? value
      : "public";
}


function mapAccountPreferences(
  row: AccountPreferencesRow | null,
): AccountPreferences {

  if (!row) {

    return {
      ...defaultAccountPreferences,
    };
  }


  return {
    theme:
      accountTheme(
        row.theme,
      ),

    language:
      row.language ||
      "fr",

    emailPrepared:
      row.email_enabled,

    pushPrepared:
      row.push_enabled,

    profileVisibility:
      profileVisibility(
        row.profile_visibility,
      ),

    discoverable:
      row.discoverable,

    dataExportPrepared:
      row.data_export_requested_at !==
      null,

    deletionPrepared:
      row.deletion_requested_at !==
      null,
  };
}

export class IdentitySupabaseRepository extends IdentityMemoryRepository {

  constructor(private readonly supabase: SupabaseClient<Database>) {
    super();
  }

  private async userId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw normalizeBackendError(error);
    if (!data.user) throw new BackendError("UNAUTHENTICATED");
    return data.user.id;
  }

  private async roleId(slug: PublicIdentityRole): Promise<string> {
    const { data, error } = await this.supabase
      .from("roles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new BackendError("NOT_FOUND", "Ce rÃ´le n'est pas configurÃ©.");
    return data.id;
  }

  private async finishRegistrationMetadata(): Promise<void> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new BackendError("UNAUTHENTICATED");
    const { error: updateError } = await this.supabase.auth.updateUser({
      data: {
        ...data.user.user_metadata,
        profile_setup_pending: "false",
        requested_role: "",
      },
    });
    if (updateError) throw updateError;
  }

  override async completeRegistration(input: RegistrationProfile): Promise<RoleAssignmentOutcome> {
    const userId = await this.userId();
    try {
      const { data: existingProfile, error: existingProfileError } = await this.supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle();
      if (existingProfileError) throw existingProfileError;
      // KORANA-K5-C2D2-AUTO-USERNAME-LOWERCASE
      const usernameRoot = input.email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, "-")
        .slice(0, 20) || "membre";
      const username = existingProfile?.username || `${usernameRoot}-${userId.slice(0, 8)}`;
      const { error: profileError } = await this.supabase.from("profiles").upsert({
        id: userId,
        full_name: input.fullName,
        email: input.email,
        username,
        region_id: input.regionId,
        city_id: input.cityId,
      });
      if (profileError) throw profileError;

      let outcome: RoleAssignmentOutcome;
      if (isControlledIdentityRole(input.role)) {
        await this.assignFlexibleRole("fan", { makePrimary: true });
        await this.createRoleRequest({
          role: input.role,
          reason: "Demande crÃ©Ã©e automatiquement lors de l'inscription.",
          justificationsPrepared: [],
        });
        outcome = { kind: "pending", role: input.role };
      } else if (isFlexibleIdentityRole(input.role)) {
        outcome = await this.assignFlexibleRole(input.role, { makePrimary: true });
      } else {
        throw new BackendError("FORBIDDEN", "Ce rÃ´le ne peut pas Ãªtre attribuÃ© publiquement.");
      }
      await this.finishRegistrationMetadata();
      return outcome;
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async completePendingRegistration(): Promise<RoleAssignmentOutcome | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      const user = data.user;
      if (!user || user.user_metadata?.profile_setup_pending !== "true") return null;
      const requested = String(user.user_metadata?.requested_role || user.user_metadata?.primary_role || "");
      if (!isPublicIdentityRole(requested)) {
        throw new BackendError("FORBIDDEN", "Le rÃ´le d'inscription n'est pas autorisÃ©.");
      }
      return this.completeRegistration({
        fullName: String(user.user_metadata?.full_name || user.email?.split("@")[0] || "Membre"),
        email: user.email || "",
        role: requested,
        regionId: String(user.user_metadata?.region_id || ""),
        cityId: String(user.user_metadata?.city_id || ""),
      });
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }
  override async snapshot(): Promise<IdentitySnapshot> {
    const userId = await this.userId();
    const memory = await super.snapshot();

    try {
      const [
        profileResult,
        profileRolesResult,
        profileSystemRolesResult,
        rolesResult,
        systemRolesResult,
        disciplinesResult,
        userDisciplinesResult,
        regionsResult,
        citiesResult,
        membershipsResult,
        ownedOrganizationsResult,
        roleRequestsResult,
        preferencesResult,
        activeOrganizationResult,
      ] = await Promise.all([
        this.supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        this.supabase.from("profile_roles").select("role_id").eq("profile_id", userId),
        this.supabase.from("profile_system_roles").select("system_role_id").eq("profile_id", userId),
        this.supabase.from("roles").select("*").order("label"),
        this.supabase.from("system_roles").select("*").order("label"),
        this.supabase.from("disciplines").select("id,name").order("name"),
        this.supabase.from("user_disciplines").select("discipline_id").eq("user_id", userId),
        this.supabase.from("regions").select("id,name").order("name"),
        this.supabase.from("cities").select("id,name,region_id").order("name"),
        this.supabase.from("organization_members").select("*").eq("profile_id", userId),
        this.supabase.from("organizations").select("*").eq("owner_id", userId),
        this.supabase.from("role_requests").select("*").eq("profile_id", userId).order("submitted_at", { ascending: false }),
        this.supabase.from("account_preferences").select("*").eq("profile_id", userId).maybeSingle(),
        this.supabase.from("active_organizations").select("organization_id,selected_at").eq("profile_id", userId).maybeSingle(),
      ]);

      const firstError = [
        profileResult.error, profileRolesResult.error, profileSystemRolesResult.error,
        rolesResult.error, systemRolesResult.error, disciplinesResult.error,
        userDisciplinesResult.error, regionsResult.error, citiesResult.error,
        membershipsResult.error, ownedOrganizationsResult.error,
        roleRequestsResult.error, preferencesResult.error,
        activeOrganizationResult.error,
      ].find(Boolean);
      if (firstError) throw firstError;
      let userProfile = profileResult.data;
      const { data: userData } = await this.supabase.auth.getUser();
      const registeredUser = userData?.user;
      if (!userProfile && registeredUser) {
        const userEmail = registeredUser.email ?? "user@indesy-mialy.mg";
        const fullName = String(registeredUser.user_metadata?.full_name ?? userEmail.split("@")[0]);
        const usernameRoot = userEmail
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9_.-]/g, "-")
          .slice(0, 20) || "membre";
        const username = `${usernameRoot}-${userId.slice(0, 8)}`;
        const regionId = String(registeredUser.user_metadata?.region_id ?? "");
        const cityId = String(registeredUser.user_metadata?.city_id ?? "");
        const { data: createdProfile, error: creationError } = await this.supabase.from("profiles").upsert({
          id: userId, email: userEmail, full_name: fullName, username, region_id: regionId, city_id: cityId,
        }).select().maybeSingle();
        if (creationError) throw creationError;
        userProfile = createdProfile;
      }
      const memberRows = membershipsResult.data ?? [];
      const memberOrganizationIds = memberRows
        .map((member) => member.organization_id)
        .filter((id): id is string => Boolean(id));
      const memberOrganizationsResult = memberOrganizationIds.length
        ? await this.supabase.from("organizations").select("*").in("id", memberOrganizationIds)
        : { data: [] as OrganizationRow[], error: null };
      if (memberOrganizationsResult.error) throw memberOrganizationsResult.error;

      const requestIds = (roleRequestsResult.data ?? []).map((request) => request.id);
      const historyResult = requestIds.length
        ? await this.supabase.from("role_request_history").select("*").in("role_request_id", requestIds).order("created_at")
        : { data: [] as RoleRequestHistoryRow[], error: null };
      const documentsResult = requestIds.length
        ? await this.supabase.from("role_request_documents").select("*").in("role_request_id", requestIds).order("created_at")
        : { data: [] as RoleRequestDocumentRow[], error: null };
      if (historyResult.error) throw historyResult.error;
      if (documentsResult.error) throw documentsResult.error;

      const organizations = new Map<string, OrganizationRow>();
      [...(ownedOrganizationsResult.data ?? []), ...(memberOrganizationsResult.data ?? [])]
        .forEach((organization) => organizations.set(organization.id, organization));

      const businessRoleIds = new Set((profileRolesResult.data ?? []).map((item) => item.role_id));
      const systemRoleIds = new Set((profileSystemRolesResult.data ?? []).map((item) => item.system_role_id));
      const businessRoles = (rolesResult.data ?? []).filter((role) => businessRoleIds.has(role.id));
      const systemRoles = (systemRolesResult.data ?? []).filter((role) => systemRoleIds.has(role.id));
      const assignedRoles = [
        ...systemRoles.map((role) => asIdentityRole(role.code)),
        ...businessRoles.map((role) => asIdentityRole(role.slug)),
      ].filter((role): role is IdentityRole => role !== null);
      const storedPrimaryRole = businessRoles.find((role) => role.id === userProfile?.primary_role_id);
      const preferredRole = asIdentityRole(storedPrimaryRole?.slug);
      const onboardingResult = await this.supabase
        .from("onboarding_progress")
        .select("completed_at")
        .eq("profile_id", userId)
        .maybeSingle();
      if (onboardingResult.error) throw onboardingResult.error;
      const profile = userProfile
        ? this.mapProfile(
            userProfile,
            userDisciplinesResult.data?.map((item) => item.discipline_id) ?? [],
            assignedRoles,
            preferredRole,
            memory.draft.profile
          )
        : memory.draft.profile;
      profile.onboardingComplete = Boolean(onboardingResult.data?.completed_at) || memory.draft.profile.onboardingComplete;

      const rolesById = new Map((rolesResult.data ?? []).map((role) => [role.id, role.slug]));
      const roleRequests = (roleRequestsResult.data ?? []).flatMap((request) => {
        const role = rolesById.get(request.role_id);
        const identityRole = role ? asIdentityRole(role) : null;
        if (!identityRole || !isControlledIdentityRole(identityRole)) return [];
        return [this.mapRoleRequest(
          request,
          identityRole,
          historyResult.data ?? [],
          documentsResult.data ?? [],
        )];
      });

      return {
        ...memory,
        draft: { ...memory.draft, profile },
        organizations: [...organizations.values()].map((organization) =>
          this.mapOrganization(organization, memberRows)
        ),
        roleRequests,
        activeOrganizationId:
          activeOrganizationResult.data?.organization_id ??
          undefined,
        preferences: mapAccountPreferences(preferencesResult.data),
        sessions: [],
        availableRoles: [
          ...(rolesResult.data ?? []).flatMap((role) => {
            const identityRole = asIdentityRole(role.slug);
            return identityRole && isPublicIdentityRole(identityRole) ? [{
              role: identityRole,
              label: role.label,
              requiresApproval: isControlledIdentityRole(identityRole),
            }] : [];
          }),
        ],
        disciplines: disciplinesResult.data ?? [],
        regions: regionsResult.data ?? [],
        cities: (citiesResult.data ?? []).flatMap((city) =>
          city.region_id
            ? [{ id: city.id, name: city.name, regionId: city.region_id }]
            : []
        ),
      };
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async saveDraft(draft: OnboardingDraft): Promise<OnboardingDraft> {
    const userId = await this.userId();
    try {
      const profileUpdate: Database["public"]["Tables"]["profiles"]["Update"] = {
        full_name: draft.profile.fullName,
        username: draft.profile.username,
        email: draft.profile.email,
        phone: draft.profile.phone ?? null,
        region_id: draft.profile.regionId,
        city_id: draft.profile.cityId,
        status: draft.profile.status,
      };

      const { error: profileError } = await this.supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);
      if (profileError) throw profileError;

      const { error: deleteError } = await this.supabase
        .from("user_disciplines")
        .delete()
        .eq("user_id", userId);
      if (deleteError) throw deleteError;

      if (draft.profile.disciplineIds.length) {
        const { error: disciplineError } = await this.supabase
          .from("user_disciplines")
          .insert(draft.profile.disciplineIds.map((disciplineId) => ({
            user_id: userId,
            discipline_id: disciplineId,
          })));
        if (disciplineError) throw disciplineError;
      }

      return super.saveDraft(draft);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async completeOnboarding(): Promise<PrivateProfile> {
    const userId = await this.userId();
    try {
      const { error } = await this.supabase.from("onboarding_progress").upsert({
        profile_id: userId,
        current_step: "success",
        completed_steps: ["profile", "disciplines", "role", "organization", "review", "success"],
        completed_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });
      if (error) throw error;
      return super.completeOnboarding();
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }
  override async updateProfile(patch: Partial<PrivateProfile>): Promise<PrivateProfile> {
    const state = await this.snapshot();
    const draft = {
      ...state.draft,
      profile: { ...state.draft.profile, ...patch },
    };
    return (await this.saveDraft(draft)).profile;
  }

  override async assignFlexibleRole(
    role: IdentityRole,
    options: { makePrimary?: boolean } = {},
  ): Promise<RoleAssignmentOutcome> {
    if (!isFlexibleIdentityRole(role)) {
      throw new BackendError("FORBIDDEN", "Ce rÃ´le ne peut pas Ãªtre attribuÃ© directement.");
    }
    try {
      const profileId = await this.userId();
      const roleId = await this.roleId(role);
      const { data: existing, error: existingError } = await this.supabase
        .from("profile_roles")
        .select("id")
        .eq("profile_id", profileId)
        .eq("role_id", roleId)
        .maybeSingle();
      if (existingError) throw existingError;

      const assignment: Database["public"]["Tables"]["profile_roles"]["Insert"] = {
        profile_id: profileId,
        role_id: roleId,
      };
      const { error: assignmentError } = await this.supabase
        .from("profile_roles")
        .upsert(assignment, {
          onConflict: "profile_id,role_id",
          ignoreDuplicates: true,
        });
      if (assignmentError) throw assignmentError;

      if (options.makePrimary) {
        const { error: primaryRoleError } = await this.supabase
          .from("profiles")
          .update({ primary_role_id: roleId })
          .eq("id", profileId);
        if (primaryRoleError) {
          const normalized = normalizeBackendError(primaryRoleError);
          if (normalized.code !== "FORBIDDEN") throw normalized;
        }
      }
      return { kind: existing ? "already_assigned" : "assigned", role };
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async createRoleRequest(
    input: Pick<IdentityRoleRequest, "role" | "reason" | "justificationsPrepared">
  ): Promise<IdentityRoleRequest> {
    if (!isControlledIdentityRole(input.role)) {
      throw new BackendError("FORBIDDEN", "Seules les demandes FÃ©dÃ©ration et Ligue nÃ©cessitent une validation.");
    }
    const reason = input.reason.trim();
    if (reason.length < 10) {
      throw new BackendError("VALIDATION_ERROR", "Le motif doit contenir au moins 10 caractÃ¨res.");
    }
    try {
      const profileId = await this.userId();
      const roleId = await this.roleId(input.role);
      const { data: assignment, error: assignmentError } = await this.supabase
        .from("profile_roles")
        .select("id")
        .eq("profile_id", profileId)
        .eq("role_id", roleId)
        .maybeSingle();
      if (assignmentError) throw assignmentError;
      if (assignment) {
        throw new BackendError("VALIDATION_ERROR", "Vous possÃ©dez dÃ©jÃ  ce rÃ´le.");
      }

      const { data: pending, error: pendingError } = await this.supabase
        .from("role_requests")
        .select("*")
        .eq("profile_id", profileId)
        .eq("role_id", roleId)
        .eq("status", "pending")
        .maybeSingle();
      if (pendingError) throw pendingError;
      if (pending) return this.mapRoleRequest(pending, input.role, [], []);

      const payload: Database["public"]["Tables"]["role_requests"]["Insert"] = {
        profile_id: profileId,
        role_id: roleId,
        reason,
        status: "pending",
      };
      const { data: created, error: creationError } = await this.supabase
        .from("role_requests")
        .insert(payload)
        .select()
        .single();
      if (creationError) {
        if (creationError.code === "23505") {
          const { data: concurrent, error: concurrentError } = await this.supabase
            .from("role_requests")
            .select("*")
            .eq("profile_id", profileId)
            .eq("role_id", roleId)
            .eq("status", "pending")
            .single();
          if (concurrentError) throw concurrentError;
          return this.mapRoleRequest(concurrent, input.role, [], []);
        }
        throw creationError;
      }
      return this.mapRoleRequest(created, input.role, [], []);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async createOrganization(
    input: Omit<IdentityOrganization, "id" | "ownerId" | "members" | "status">
  ): Promise<IdentityOrganization> {
    try {
      const { data: organizationId, error } = await this.supabase.rpc("create_my_organization", {
        p_name: input.name, p_type: input.type, p_description: input.description || undefined,
        p_email: input.email || undefined, p_phone: input.phone || undefined, p_website: input.website || undefined,
        p_region_id: input.regionId || undefined, p_city_id: input.cityId || undefined, p_discipline: input.disciplines[0] ?? undefined,
      });
      if (error) throw error;
      const state = await this.snapshot();
      const organization = state.organizations.find(item => item.id === organizationId);
      if (!organization) throw new BackendError("NOT_FOUND");
      return organization;
    } catch (reason) {
      const source = reason as { code?: string; message?: string } | null;
      if (source?.code === "PGRST202" || source?.message?.includes("create_my_organization")) {
        throw new BackendError("STORAGE_NOT_IMPLEMENTED", "La mise Ã  jour du module Organisation doit Ãªtre appliquÃ©e avant la crÃ©ation.", reason);
      }
      throw normalizeBackendError(reason);
    }
  }

  override async updateOrganization(
    id: string,
    patch: Partial<Pick<IdentityOrganization, "name" | "description" | "regionId" | "cityId" | "email" | "phone" | "website" | "disciplines">>
  ): Promise<IdentityOrganization> {
    const state = await this.snapshot();
    const current = state.organizations.find(item => item.id === id);
    if (!current) throw new BackendError("NOT_FOUND");
    try {
      const { error } = await this.supabase.rpc("update_my_organization", {
        p_organization_id: id, p_name: patch.name ?? current.name,
        p_description: patch.description ?? current.description, p_email: patch.email ?? current.email ?? undefined,
        p_phone: patch.phone ?? current.phone ?? undefined, p_website: patch.website ?? current.website ?? undefined,
        p_region_id: patch.regionId ?? current.regionId ?? undefined, p_city_id: patch.cityId ?? current.cityId ?? undefined,
        p_discipline: patch.disciplines?.[0] ?? current.disciplines[0] ?? undefined,
      });
      if (error) throw error;
      const refreshed = await this.snapshot();
      const organization = refreshed.organizations.find(item => item.id === id);
      if (!organization) throw new BackendError("NOT_FOUND");
      return organization;
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }
  override async savePreferences(
    value: AccountPreferences,
  ): Promise<AccountPreferences> {

    const userId =
      await this.userId();


    try {

      const payload:
        Database["public"]["Tables"]["account_preferences"]["Insert"] = {

        profile_id:
          userId,

        theme:
          value.theme,

        language:
          value.language.trim() ||
          "fr",

        profile_visibility:
          value.profileVisibility,

        discoverable:
          value.discoverable,

        email_enabled:
          value.emailPrepared,

        push_enabled:
          value.pushPrepared,

        updated_at:
          new Date().toISOString(),
      };


      const {
        data,
        error,
      } =
        await this.supabase
          .from("account_preferences")
          .upsert(
            payload,
            {
              onConflict:
                "profile_id",
            },
          )
          .select("*")
          .single();


      if (error) {

        throw error;
      }


      return mapAccountPreferences(
        data,
      );

    } catch (reason) {

      throw normalizeBackendError(
        reason,
      );
    }
  }

  override async setActiveOrganization(id: string): Promise<void> {

    const userId = await this.userId();
    try {
      const { error } = await this.supabase.from("active_organizations").upsert({
        profile_id: userId,
        organization_id: id,
        selected_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });
      if (error) throw error;
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  private mapRoleRequest(
    request: RoleRequestRow,
    role: PublicIdentityRole,
    historyRows: RoleRequestHistoryRow[],
    documentRows: RoleRequestDocumentRow[],
  ): IdentityRoleRequest {
    const history = historyRows
      .filter((entry) => entry.role_request_id === request.id)
      .map((entry) => ({
        status: asRoleRequestStatus(entry.to_status),
        at: entry.created_at,
        reason: entry.reason ?? undefined,
      }));
    return {
      id: request.id,
      profileId: request.profile_id,
      role,
      reason: request.reason,
      justificationsPrepared: documentRows
        .filter((document) => document.role_request_id === request.id)
        .map((document) => document.file_name),
      status: asRoleRequestStatus(request.status),
      history: history.length
        ? history
        : [{ status: asRoleRequestStatus(request.status), at: request.submitted_at }],
      notificationPrepared: false,
      createdAt: request.submitted_at,
    };
  }

  private mapProfile(
    row: ProfileRow,
    disciplineIds: string[],
    roles: IdentityRole[],
    preferredRole: string | null,
    memory: PrivateProfile
  ): PrivateProfile {
    return {
      ...memory,
      id: row.id,
      fullName: row.full_name,
      username: row.username,
      email: row.email,
      phone: row.phone ?? undefined,
      photoPrepared: row.photo_url ?? undefined,
      regionId: row.region_id ?? "",
      cityId: row.city_id ?? "",
      disciplineIds,
      primaryRole: getPrimaryIdentityRole(roles, preferredRole),
      secondaryRoles: roles.filter((role) => role !== getPrimaryIdentityRole(roles, preferredRole)),
      status: profileStatus(row.status),
    };
  }

  private mapOrganization(
    row: OrganizationRow,
    memberships: OrganizationMemberRow[]
  ): IdentityOrganization {
    return {
      id: row.id,
      name: row.name,
      type: organizationType(row.type),
      description: row.description ?? "",
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      website: row.website ?? undefined,
      ownerId: row.owner_id,
      regionId: row.region_id ?? undefined,
      cityId: row.city_id ?? undefined,
      disciplines: row.discipline ? [row.discipline] : [],
      status: organizationStatus(row.status),
      members: memberships
        .filter((member) => member.organization_id === row.id && member.profile_id)
        .map((member) => ({
          profileId: member.profile_id as string,
          role: member.role ?? "member",
          status: member.status ?? "active",
        })),
      invitationsPrepared: [],
      internalRolesPrepared: [],
    };
  }
}
