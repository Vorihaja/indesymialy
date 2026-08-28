export const PROFILE_AVATAR_BUCKET =
  "profile-avatars" as const;


export const PROFILE_AVATAR_MAX_BYTES =
  5 * 1024 * 1024;


export const PROFILE_AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;


export type ProfileAvatarMimeType =
  (typeof PROFILE_AVATAR_ALLOWED_MIME_TYPES)[number];


export interface ProfileAvatarResult {
  photoUrl:
    string | null;

  storagePath:
    string | null;
}