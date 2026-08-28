import {
  PROFILE_AVATAR_ALLOWED_MIME_TYPES,
  PROFILE_AVATAR_MAX_BYTES,
  type ProfileAvatarMimeType,
} from "../profile-avatar.types";

import type {
  ProfileAvatarRepository,
} from "../repositories/profile-avatar.repository";


function isAllowedMimeType(
  value: string,
): value is ProfileAvatarMimeType {

  return (
    PROFILE_AVATAR_ALLOWED_MIME_TYPES as
      readonly string[]
  ).includes(
    value,
  );
}


export class ProfileAvatarService {

  constructor(
    private readonly repository:
      ProfileAvatarRepository,
  ) {}


  upload(
    file: File,
  ) {

    if (
      file.size <=
      0
    ) {

      throw new Error(
        "Le fichier sélectionné est vide.",
      );
    }


    if (
      !isAllowedMimeType(
        file.type,
      )
    ) {

      throw new Error(
        "Format non accepté. Utilisez une image JPG, PNG ou WebP.",
      );
    }


    if (
      file.size >
      PROFILE_AVATAR_MAX_BYTES
    ) {

      throw new Error(
        "L’image dépasse la taille maximale autorisée de 5 Mo.",
      );
    }


    return this.repository.upload(
      file,
    );
  }


  remove() {

    return this.repository.remove();
  }
}