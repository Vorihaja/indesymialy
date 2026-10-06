import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  OrganizationPersonnelSupabaseRepository,
} from "../repositories/organization-personnel.repository";

import {
  OrganizationPersonnelService,
} from "../services/organization-personnel.service";

import {
  OrganizationPersonnelUseCase,
} from "../use-cases/organization-personnel.use-case";

export function createOrganizationPersonnelUseCase() {
  const repository =
    new OrganizationPersonnelSupabaseRepository(
      createSupabaseBrowserClient(),
    );

  const service =
    new OrganizationPersonnelService(
      repository,
    );

  return new OrganizationPersonnelUseCase(
    service,
  );
}
