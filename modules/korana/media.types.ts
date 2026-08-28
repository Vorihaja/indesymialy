export type KoranaMediaType =
  | "image"
  | "video";


export interface KoranaMediaUploadInput {
  actorId: string;

  postId: string;

  file: File;

  position: number;
}


export interface KoranaMediaMutationResult {
  id: string;

  postId: string;

  storagePath: string;

  mediaType:
    KoranaMediaType;

  mimeType:
    string | null;

  fileSizeBytes:
    number | null;

  width:
    number | null;

  height:
    number | null;

  durationSeconds:
    number | null;

  altText:
    string | null;

  position:
    number;

  createdAt:
    string;
}


export interface KoranaMediaDetachResult {
  id: string;

  postId: string;

  storagePath: string;
}


export interface KoranaSignedMediaUrl {
  storagePath: string;

  url: string;
}