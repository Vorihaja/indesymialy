import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import {
  normalizeBackendError,
} from "@/shared/errors/backend-error";

import {
  PROFILE_AVATAR_BUCKET,
  type ProfileAvatarResult,
} from "../profile-avatar.types";

import type {
  ProfileAvatarRepository,
} from "./profile-avatar.repository";


function extensionFor(
  file: File,
): string {

  switch (
    file.type
  ) {

    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      throw new Error(
        "Format d’image non accepté.",
      );
  }
}


export class ProfileAvatarSupabaseRepository
  implements ProfileAvatarRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  private async currentUserId():
    Promise<string> {

    const {
      data,
      error,
    } =
      await this.supabase.auth.getUser();


    if (error) {

      throw error;
    }


    if (
      !data.user
    ) {

      throw new Error(
        "Votre session utilisateur est introuvable.",
      );
    }


    return data.user.id;
  }


  private async currentPhotoUrl(
    profileId: string,
  ): Promise<string | null> {

    const {
      data,
      error,
    } =
      await this.supabase
        .from("profiles")
        .select("photo_url")
        .eq(
          "id",
          profileId,
        )
        .single();


    if (error) {

      throw error;
    }


    return data.photo_url;
  }


  private storagePathFromPublicUrl(
    url: string,
  ): string | null {

    const marker =
      `/storage/v1/object/public/${PROFILE_AVATAR_BUCKET}/`;


    const markerIndex =
      url.indexOf(
        marker,
      );


    if (
      markerIndex <
      0
    ) {

      return null;
    }


    const encodedPath =
      url
        .slice(
          markerIndex +
          marker.length,
        )
        .split("?")[0];


    try {

      return decodeURIComponent(
        encodedPath,
      );

    } catch {

      return encodedPath;
    }
  }


  private async updateCanonicalPhoto(
    profileId: string,
    photoUrl: string | null,
  ): Promise<string | null> {

    const {
      data,
      error,
    } =
      await this.supabase
        .from("profiles")
        .update(
          {
            photo_url:
              photoUrl,
          },
        )
        .eq(
          "id",
          profileId,
        )
        .select(
          "photo_url",
        )
        .single();


    if (error) {

      throw error;
    }


    return data.photo_url;
  }


  private async removeObject(
    path: string,
  ): Promise<void> {

    const {
      error,
    } =
      await this.supabase.storage
        .from(
          PROFILE_AVATAR_BUCKET,
        )
        .remove(
          [
            path,
          ],
        );


    if (error) {

      throw error;
    }
  }


  async upload(
    file: File,
  ): Promise<ProfileAvatarResult> {

    try {

      const profileId =
        await this.currentUserId();


      const previousPhotoUrl =
        await this.currentPhotoUrl(
          profileId,
        );


      const extension =
        extensionFor(
          file,
        );


      const path =
        `${profileId}/${crypto.randomUUID()}.${extension}`;


      const {
        error: uploadError,
      } =
        await this.supabase.storage
          .from(
            PROFILE_AVATAR_BUCKET,
          )
          .upload(
            path,
            file,
            {
              cacheControl:
                "3600",

              contentType:
                file.type,

              upsert:
                false,
            },
          );


      if (uploadError) {

        throw uploadError;
      }


      const {
        data: publicUrlData,
      } =
        this.supabase.storage
          .from(
            PROFILE_AVATAR_BUCKET,
          )
          .getPublicUrl(
            path,
          );


      const newPhotoUrl =
        publicUrlData.publicUrl;


      try {

        await this.updateCanonicalPhoto(
          profileId,
          newPhotoUrl,
        );

      } catch (
        profileUpdateError
      ) {

        await this.supabase.storage
          .from(
            PROFILE_AVATAR_BUCKET,
          )
          .remove(
            [
              path,
            ],
          );


        throw profileUpdateError;
      }


      if (
        previousPhotoUrl
      ) {

        const previousPath =
          this.storagePathFromPublicUrl(
            previousPhotoUrl,
          );


        if (
          previousPath &&
          previousPath !==
            path &&
          previousPath.startsWith(
            `${profileId}/`,
          )
        ) {

          try {

            await this.removeObject(
              previousPath,
            );

          } catch (
            cleanupError
          ) {

            /*
             * L'avatar précédent doit rester la référence
             * canonique si son nettoyage échoue.
             */

            const {
              error: rollbackError,
            } =
              await this.supabase
                .from("profiles")
                .update(
                  {
                    photo_url:
                      previousPhotoUrl,
                  },
                )
                .eq(
                  "id",
                  profileId,
                );


            await this.supabase.storage
              .from(
                PROFILE_AVATAR_BUCKET,
              )
              .remove(
                [
                  path,
                ],
              );


            if (
              rollbackError
            ) {

              throw rollbackError;
            }


            throw cleanupError;
          }
        }
      }


      return {
        photoUrl:
          newPhotoUrl,

        storagePath:
          path,
      };

    } catch (
      reason
    ) {

      throw normalizeBackendError(
        reason,
      );
    }
  }


  async remove():
    Promise<ProfileAvatarResult> {

    try {

      const profileId =
        await this.currentUserId();


      const previousPhotoUrl =
        await this.currentPhotoUrl(
          profileId,
        );


      if (
        !previousPhotoUrl
      ) {

        return {
          photoUrl:
            null,

          storagePath:
            null,
        };
      }


      await this.updateCanonicalPhoto(
        profileId,
        null,
      );


      const previousPath =
        this.storagePathFromPublicUrl(
          previousPhotoUrl,
        );


      if (
        previousPath &&
        previousPath.startsWith(
          `${profileId}/`,
        )
      ) {

        try {

          await this.removeObject(
            previousPath,
          );

        } catch (
          cleanupError
        ) {

          const {
            error: rollbackError,
          } =
            await this.supabase
              .from("profiles")
              .update(
                {
                  photo_url:
                    previousPhotoUrl,
                },
              )
              .eq(
                "id",
                profileId,
              );


          if (
            rollbackError
          ) {

            throw rollbackError;
          }


          throw cleanupError;
        }
      }


      return {
        photoUrl:
          null,

        storagePath:
          null,
      };

    } catch (
      reason
    ) {

      throw normalizeBackendError(
        reason,
      );
    }
  }
}