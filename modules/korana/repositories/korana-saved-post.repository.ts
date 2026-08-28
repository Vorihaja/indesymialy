import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  KoranaCurrentActor,
  KoranaFeedActor,
} from "../feed.types";

import type {
  GetKoranaSavedPostsInput,
  KoranaSavedLibraryItem,
  KoranaSavedPostMutationResult,
  KoranaSavedPostsPagination,
  KoranaSavedPostsSnapshot,
  SetKoranaSavedPostInput,
} from "../saved-post.types";


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


function array(
  value: unknown,
): unknown[] {

  return Array.isArray(
    value,
  )
    ? value
    : [];
}


function text(
  value: unknown,
): string {

  return typeof value ===
    "string"
      ? value
      : "";
}


function nullableText(
  value: unknown,
): string | null {

  return typeof value ===
    "string"
      ? value
      : null;
}


function number(
  value: unknown,
): number {

  const result =
    Number(
      value,
    );


  return Number.isFinite(
    result,
  )
    ? result
    : 0;
}


function currentActor(
  value: unknown,
): KoranaCurrentActor | null {

  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {

    return null;
  }


  return value as unknown as
    KoranaCurrentActor;
}


function actor(
  value: unknown,
): KoranaFeedActor | null {

  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {

    return null;
  }


  return value as unknown as
    KoranaFeedActor;
}


function savedItem(
  value: unknown,
): KoranaSavedLibraryItem | null {

  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {

    return null;
  }


  const row =
    record(
      value,
    );


  if (
    !text(
      row.id,
    )
  ) {

    return null;
  }


  return value as unknown as
    KoranaSavedLibraryItem;
}


function pagination(
  value: unknown,
): KoranaSavedPostsPagination {

  const row =
    record(
      value,
    );


  return {
    limit:
      number(
        row.limit,
      ),

    nextBefore:
      nullableText(
        row.nextBefore,
      ),

    hasMore:
      row.hasMore ===
      true,
  };
}


export class KoranaSavedPostRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async set(
    input:
      SetKoranaSavedPostInput,
  ): Promise<KoranaSavedPostMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_set_saved_post",
        {
          p_actor_id:
            input.actorId,

          p_post_id:
            input.postId,

          p_saved:
            input.saved,
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

      saved:
        root.saved ===
        true,
    };
  }


  async loadLibrary(
    input:
      GetKoranaSavedPostsInput,
  ): Promise<KoranaSavedPostsSnapshot> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_saved_posts_snapshot",
        {
          p_actor_id:
            input.actorId ??
            undefined,

          p_limit:
            input.limit ??
            30,

          p_before:
            input.before ??
            undefined,
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
      currentActor:
        currentActor(
          root.currentActor,
        ),

      myActors:
        array(
          root.myActors,
        )
          .map(
            actor,
          )
          .filter(
            (
              item,
            ): item is KoranaFeedActor =>
              item !== null,
          ),

      items:
        array(
          root.items,
        )
          .map(
            savedItem,
          )
          .filter(
            (
              item,
            ): item is KoranaSavedLibraryItem =>
              item !== null,
          ),

      total:
        number(
          root.total,
        ),

      pagination:
        pagination(
          root.pagination,
        ),
    };
  }
}