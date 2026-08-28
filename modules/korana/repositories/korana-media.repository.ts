import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  KoranaMediaDetachResult,
  KoranaMediaMutationResult,
  KoranaMediaType,
  KoranaMediaUploadInput,
  KoranaSignedMediaUrl,
} from "../media.types";


const BUCKET =
  "korana-media";


type JsonRecord =
  Record<string, unknown>;


function record(
  value: unknown,
): JsonRecord {

  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value as JsonRecord
    : {};
}


function text(
  value: unknown,
): string {

  return typeof value === "string"
    ? value
    : "";
}


function nullableText(
  value: unknown,
): string | null {

  return typeof value === "string"
    ? value
    : null;
}


function nullableNumber(
  value: unknown,
): number | null {

  if (
    value === null ||
    value === undefined
  ) {

    return null;
  }


  const parsed =
    Number(value);


  return Number.isFinite(parsed)
    ? parsed
    : null;
}


function mediaType(
  value: unknown,
): KoranaMediaType {

  return value === "video"
    ? "video"
    : "image";
}


function extensionFor(
  file: File,
): string {

  switch (file.type) {

    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/gif":
      return "gif";

    case "video/mp4":
      return "mp4";

    case "video/webm":
      return "webm";

    default:
      return "bin";
  }
}


function mapMutation(
  value: unknown,
): KoranaMediaMutationResult {

  const row =
    record(value);


  return {
    id:
      text(
        row.id,
      ),

    postId:
      text(
        row.postId,
      ),

    storagePath:
      text(
        row.storagePath,
      ),

    mediaType:
      mediaType(
        row.mediaType,
      ),

    mimeType:
      nullableText(
        row.mimeType,
      ),

    fileSizeBytes:
      nullableNumber(
        row.fileSizeBytes,
      ),

    width:
      nullableNumber(
        row.width,
      ),

    height:
      nullableNumber(
        row.height,
      ),

    durationSeconds:
      nullableNumber(
        row.durationSeconds,
      ),

    altText:
      nullableText(
        row.altText,
      ),

    position:
      nullableNumber(
        row.position,
      ) ?? 0,

    createdAt:
      text(
        row.createdAt,
      ),
  };
}


function mapDetach(
  value: unknown,
): KoranaMediaDetachResult {

  const row =
    record(value);


  return {
    id:
      text(
        row.id,
      ),

    postId:
      text(
        row.postId,
      ),

    storagePath:
      text(
        row.storagePath,
      ),
  };
}


export class KoranaMediaRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  // =========================================================
  // UPLOAD + ATTACH
  // =========================================================

  async uploadAndAttach(
    input:
      KoranaMediaUploadInput,
  ): Promise<KoranaMediaMutationResult> {

    const mediaTypeValue:
      KoranaMediaType =
        input.file.type.startsWith(
          "video/",
        )
          ? "video"
          : "image";


    const storagePath =
      `${input.actorId}/${input.postId}/${crypto.randomUUID()}.${extensionFor(input.file)}`;


    const {
      error: uploadError,
    } =
      await this.supabase.storage
        .from(
          BUCKET,
        )
        .upload(
          storagePath,
          input.file,
          {
            cacheControl:
              "3600",

            contentType:
              input.file.type,

            upsert:
              false,
          },
        );


    if (uploadError) {

      throw new Error(
        uploadError.message,
      );
    }


    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_attach_post_media",
        {
          p_post_id:
            input.postId,

          p_storage_path:
            storagePath,

          p_media_type:
            mediaTypeValue,

          p_mime_type:
            input.file.type,

          p_file_size_bytes:
            input.file.size,

          p_position:
            input.position,

          p_width_px:
            undefined,

          p_height_px:
            undefined,

          p_duration_seconds:
            undefined,

          p_alt_text:
            undefined,
        },
      );


    if (error) {

      await this.supabase.storage
        .from(
          BUCKET,
        )
        .remove(
          [
            storagePath,
          ],
        );


      throw new Error(
        error.message,
      );
    }


    return mapMutation(
      data,
    );
  }


  // =========================================================
  // DETACH + STORAGE CLEANUP
  // =========================================================

  async detach(
    mediaId: string,
  ): Promise<KoranaMediaDetachResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_detach_post_media",
        {
          p_media_id:
            mediaId,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    const detached =
      mapDetach(
        data,
      );


    /*
     * The database relation is already removed at this stage.
     *
     * Storage cleanup is best effort. A cleanup failure does
     * not restore the database relation and therefore cannot
     * create a broken media reference in the Feed.
     */

    if (
      detached.storagePath
    ) {

      await this.supabase.storage
        .from(
          BUCKET,
        )
        .remove(
          [
            detached.storagePath,
          ],
        );
    }


    return detached;
  }


  // =========================================================
  // SIGNED PRIVATE URLS
  // =========================================================

  async createSignedUrls(
    storagePaths:
      string[],
  ): Promise<KoranaSignedMediaUrl[]> {

    const results:
      KoranaSignedMediaUrl[] =
        [];


    for (
      const storagePath
      of storagePaths
    ) {

      const {
        data,
        error,
      } =
        await this.supabase.storage
          .from(
            BUCKET,
          )
          .createSignedUrl(
            storagePath,
            3600,
          );


      if (error) {

        continue;
      }


      results.push(
        {
          storagePath,

          url:
            data.signedUrl,
        },
      );
    }


    return results;
  }
}