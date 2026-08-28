import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  ProfileAvatarSupabaseRepository,
} from "../repositories/profile-avatar-supabase.repository";

import {
  ProfileAvatarService,
} from "../services/profile-avatar.service";

import {
  ManageProfileAvatarUseCase,
} from "../use-cases/manage-profile-avatar.use-case";


let instance:
  ManageProfileAvatarUseCase | undefined;


export function createProfileAvatarUseCase() {

  instance ??=
    new ManageProfileAvatarUseCase(
      new ProfileAvatarService(
        new ProfileAvatarSupabaseRepository(
          createSupabaseBrowserClient(),
        ),
      ),
    );


  return instance;
}