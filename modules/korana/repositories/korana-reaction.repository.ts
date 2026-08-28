import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  KoranaPostReactionMutationResult,
  KoranaReactionBreakdown,
  KoranaReactionType,
  KoranaSetPostReactionInput,
} from "../reaction.types";


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


function numberValue(
  value: unknown,
): number {

  const parsed =
    Number(value);


  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


function reactionType(
  value: unknown,
): KoranaReactionType | null {

  if (
    value === "like" ||
    value === "support" ||
    value === "respect" ||
    value === "fire"
  ) {

    return value;
  }


  return null;
}


function mapBreakdown(
  value: unknown,
): KoranaReactionBreakdown {

  const row =
    record(value);


  return {
    like:
      numberValue(
        row.like,
      ),

    support:
      numberValue(
        row.support,
      ),

    respect:
      numberValue(
        row.respect,
      ),

    fire:
      numberValue(
        row.fire,
      ),
  };
}


function mapMutation(
  value: unknown,
): KoranaPostReactionMutationResult {

  const row =
    record(value);


  return {
    actorId:
      text(
        row.actorId,
      ),

    postId:
      text(
        row.postId,
      ),

    reactionType:
      reactionType(
        row.reactionType,
      ),

    reactionsCount:
      numberValue(
        row.reactionsCount,
      ),

    breakdown:
      mapBreakdown(
        row.breakdown,
      ),
  };
}


export class KoranaReactionRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async setPostReaction(
    input:
      KoranaSetPostReactionInput,
  ): Promise<KoranaPostReactionMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_set_post_reaction",
        {
          p_actor_id:
            input.actorId,

          p_post_id:
            input.postId,

          p_reaction_type:
            input.reactionType,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mapMutation(
      data,
    );
  }
}