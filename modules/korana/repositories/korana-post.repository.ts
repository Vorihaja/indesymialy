import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  KoranaPostStatus,
  KoranaPostVisibility,
  KoranaReplyControl,
} from "../types";

import type {
  CreateKoranaPostInput,
  KoranaPostMutationResult,
  UpdateKoranaPostInput,
} from "../post.types";


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
  fallback = "",
): string {

  return typeof value === "string"
    ? value
    : fallback;
}


function nullableText(
  value: unknown,
): string | null {

  return typeof value === "string"
    ? value
    : null;
}


function visibility(
  value: unknown,
): KoranaPostVisibility {

  return value === "followers"
    ? "followers"
    : "public";
}


function replyControl(
  value: unknown,
): KoranaReplyControl {

  if (
    value === "followers" ||
    value === "mentioned"
  ) {

    return value;
  }

  return "everyone";
}


function status(
  value: unknown,
): KoranaPostStatus {

  if (
    value === "draft" ||
    value === "hidden" ||
    value === "deleted"
  ) {

    return value;
  }

  return "published";
}


function hashtags(
  value: unknown,
): string[] {

  if (!Array.isArray(value)) {

    return [];
  }

  return value.filter(
    (
      item,
    ): item is string =>
      typeof item === "string",
  );
}


function mutationResult(
  value: unknown,
): KoranaPostMutationResult {

  const row =
    record(value);


  return {
    id:
      text(row.id),

    authorActorId:
      text(
        row.authorActorId,
      ),

    content:
      text(
        row.content,
      ),

    visibility:
      visibility(
        row.visibility,
      ),

    replyControl:
      replyControl(
        row.replyControl,
      ),

    status:
      status(
        row.status,
      ),

    publishedAt:
      nullableText(
        row.publishedAt,
      ),

    editedAt:
      nullableText(
        row.editedAt,
      ),

    deletedAt:
      nullableText(
        row.deletedAt,
      ),

    createdAt:
      text(
        row.createdAt,
      ),

    updatedAt:
      text(
        row.updatedAt,
      ),

    hashtags:
      hashtags(
        row.hashtags,
      ),
  };
}


export class KoranaPostRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async create(
    input:
      CreateKoranaPostInput,
  ): Promise<KoranaPostMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_create_post",
        {
          p_actor_id:
            input.actorId,

          p_content:
            input.content,

          p_visibility:
            input.visibility ??
            "public",

          p_reply_control:
            input.replyControl ??
            "everyone",

          p_hashtags:
            input.hashtags ??
            [],
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mutationResult(
      data,
    );
  }


  async update(
    input:
      UpdateKoranaPostInput,
  ): Promise<KoranaPostMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_update_post",
        {
          p_post_id:
            input.postId,

          p_content:
            input.content,

          p_visibility:
            input.visibility ??
            "public",

          p_reply_control:
            input.replyControl ??
            "everyone",

          p_hashtags:
            input.hashtags ??
            [],
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mutationResult(
      data,
    );
  }


  async remove(
    postId: string,
  ): Promise<KoranaPostMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_delete_post",
        {
          p_post_id:
            postId,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mutationResult(
      data,
    );
  }
}