import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  KoranaFollowInput,
  KoranaFollowMutationResult,
} from "../follow.types";


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


function optionalText(
  value: unknown,
): string | undefined {

  return typeof value === "string"
    ? value
    : undefined;
}


function number(
  value: unknown,
): number {

  const parsed =
    Number(value);


  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


function mapResult(
  value: unknown,
): KoranaFollowMutationResult {

  const row =
    record(value);


  const id =
    optionalText(
      row.id,
    );


  return {
    ...(id
      ? {
          id,
        }
      : {}),

    followerActorId:
      text(
        row.followerActorId,
      ),

    followedActorId:
      text(
        row.followedActorId,
      ),

    following:
      row.following === true,

    followersCount:
      number(
        row.followersCount,
      ),

    followingCount:
      number(
        row.followingCount,
      ),
  };
}


export class KoranaFollowRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async follow(
    input:
      KoranaFollowInput,
  ): Promise<KoranaFollowMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_follow_actor",
        {
          p_follower_actor_id:
            input.followerActorId,

          p_followed_actor_id:
            input.followedActorId,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mapResult(
      data,
    );
  }


  async unfollow(
    input:
      KoranaFollowInput,
  ): Promise<KoranaFollowMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_unfollow_actor",
        {
          p_follower_actor_id:
            input.followerActorId,

          p_followed_actor_id:
            input.followedActorId,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return mapResult(
      data,
    );
  }
}