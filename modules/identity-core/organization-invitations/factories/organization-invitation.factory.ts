import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  OrganizationInvitationSupabaseRepository,
} from "../repositories/organization-invitation-supabase.repository";
import {
  OrganizationInvitationService,
} from "../services/organization-invitation.service";
import {
  ManageOrganizationInvitationsUseCase,
} from "../use-cases/manage-organization-invitations.use-case";

let instance:
  | ManageOrganizationInvitationsUseCase
  | undefined;

export function createOrganizationInvitationUseCase() {
  instance ??=
    new ManageOrganizationInvitationsUseCase(
      new OrganizationInvitationService(
        new OrganizationInvitationSupabaseRepository(
          createSupabaseBrowserClient(),
        ),
      ),
    );

  return instance;
}