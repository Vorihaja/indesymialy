import type {
  ProfileAvatarService,
} from "../services/profile-avatar.service";


export class ManageProfileAvatarUseCase {

  constructor(
    private readonly service:
      ProfileAvatarService,
  ) {}


  upload(
    file: File,
  ) {

    return this.service.upload(
      file,
    );
  }


  remove() {

    return this.service.remove();
  }
}