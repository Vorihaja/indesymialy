import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  KoranaRepostMutationResult,
  SetKoranaRepostInput,
} from "../repost.types";


type JsonRecord =
  Record<string, unknown>;


function record(
  value: unknown,
): JsonRecord {

  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value as JsonRecord
    : {};
}


function text(
  value: unknown,
): string {

  return typeof value ===
    "string"
      ? value
      : "";
}


function number(
  value: unknown,
): number {

  const parsed =
    Number(value);


  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}


export class KoranaRepostRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async set(
    input:
      SetKoranaRepostInput,
  ): Promise<KoranaRepostMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_set_repost",
        {
          p_actor_id:
            input.actorId,

          p_post_id:
            input.postId,

          p_reposted:
            input.reposted,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    const root =
      record(
        data,
      );


    return {
      actorId:
        text(
          root.actorId,
        ),

      postId:
        text(
          root.postId,
        ),

      reposted:
        root.reposted ===
        true,

      repostsCount:
        number(
          root.repostsCount,
        ),
    };
  }
}