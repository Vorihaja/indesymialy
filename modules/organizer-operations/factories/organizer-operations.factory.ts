import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  OrganizerContextSupabaseRepository,
} from "../repositories/organizer-context-supabase.repository";

import {
  OrganizerOperationsHybridRepository,
} from "../repositories/organizer-operations-hybrid.repository";

import {
  OrganizerOperationsSupabaseRepository,
} from "../repositories/organizer-operations-supabase.repository";

import {
  OrganizerOperationsService,
} from "../services/organizer-operations.service";

import {
  GetOrganizerDashboardUseCase,
} from "../use-cases/get-organizer-dashboard.use-case";

import {
  GetOrganizerSectionUseCase,
} from "../use-cases/get-organizer-section.use-case";

import {
  SetOrganizerActiveEventUseCase,
} from "../use-cases/set-organizer-active-event.use-case";

const supabase =
  createSupabaseBrowserClient();

const contextRepository =
  new OrganizerContextSupabaseRepository(
    supabase,
  );

const persistentRepository =
  new OrganizerOperationsSupabaseRepository(
    supabase,
  );

const repository =
  new OrganizerOperationsHybridRepository(
    contextRepository,
    persistentRepository,
  );

const service =
  new OrganizerOperationsService(
    repository,
  );

export const organizerOperations = {
  dashboard:
    new GetOrganizerDashboardUseCase(
      service,
    ),

  section:
    new GetOrganizerSectionUseCase(
      service,
    ),

  activeEvent:
    new SetOrganizerActiveEventUseCase(
      service,
    ),
};
