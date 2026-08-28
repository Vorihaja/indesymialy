import type {
  ProfileAvatarResult,
} from "../profile-avatar.types";


export interface ProfileAvatarRepository {

  upload(
    file: File,
  ): Promise<ProfileAvatarResult>;


  remove():
    Promise<ProfileAvatarResult>;
}