import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  EventInvitationSupabaseRepository,
} from "../repositories/event-invitation-supabase.repository";
import {
  EventInvitationService,
} from "../services/event-invitation.service";
import {
  ManageEventInvitationsUseCase,
} from "../use-cases/manage-event-invitations.use-case";

let instance:
  | ManageEventInvitationsUseCase
  | undefined;

export function createEventInvitationUseCase() {
  instance ??=
    new ManageEventInvitationsUseCase(
      new EventInvitationService(
        new EventInvitationSupabaseRepository(
          createSupabaseBrowserClient(),
        ),
      ),
    );

  return instance;
}