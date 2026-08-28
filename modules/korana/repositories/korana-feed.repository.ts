import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  KoranaActorStatus,
  KoranaActorType,
  KoranaActorVisibility,
  KoranaReactionType,
} from "../types";

import type {
  GetKoranaFeedInput,
  KoranaActorSuggestion,
  KoranaCurrentActor,
  KoranaFeedActor,
  KoranaFeedAuthor,
  KoranaFeedCounts,
  KoranaFeedItem,
  KoranaFeedMedia,
  KoranaFeedMode,
  KoranaFeedPagination,
  KoranaFeedSnapshot,
  KoranaFeedViewerState,
  KoranaTrendingHashtag,
} from "../feed.types";


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

  return Array.isArray(value)
    ? value
    : [];
}


function text(
  value: unknown,
  fallback = "",
): string {

  return typeof value ===
    "string"
    ? value
    : fallback;
}


function nullableText(
  value: unknown,
): string | null {

  return typeof value ===
    "string"
    ? value
    : null;
}


function bool(
  value: unknown,
): boolean {

  return value === true;
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


function actorType(
  value: unknown,
): KoranaActorType {

  return value ===
    "organization"
    ? "organization"
    : "profile";
}


function actorVisibility(
  value: unknown,
): KoranaActorVisibility {

  return value ===
    "private"
    ? "private"
    : "public";
}


function actorStatus(
  value: unknown,
): KoranaActorStatus {

  if (
    value === "disabled" ||
    value === "suspended"
  ) {

    return value;
  }


  return "active";
}


function feedMode(
  value: unknown,
): KoranaFeedMode {

  return value ===
    "following"
    ? "following"
    : "for_you";
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


function mapFeedActor(
  value: unknown,
): KoranaFeedActor {

  const row =
    record(value);


  return {
    id:
      text(row.id),

    type:
      actorType(row.type),

    handle:
      text(row.handle),

    displayName:
      text(
        row.displayName,
        "Utilisateur Indesy",
      ),

    avatarUrl:
      nullableText(
        row.avatarUrl,
      ),

    verified:
      bool(
        row.verified,
      ),

    visibility:
      actorVisibility(
        row.visibility,
      ),

    status:
      actorStatus(
        row.status,
      ),

    profileId:
      nullableText(
        row.profileId,
      ),

    organizationId:
      nullableText(
        row.organizationId,
      ),

    isCurrent:
      bool(
        row.isCurrent,
      ),
  };
}


function mapCurrentActor(
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


  const row =
    record(value);


  return {
    id:
      text(row.id),

    type:
      actorType(row.type),

    handle:
      text(row.handle),

    displayName:
      text(
        row.displayName,
        "Utilisateur Indesy",
      ),

    avatarUrl:
      nullableText(
        row.avatarUrl,
      ),

    verified:
      bool(
        row.verified,
      ),

    visibility:
      actorVisibility(
        row.visibility,
      ),

    status:
      actorStatus(
        row.status,
      ),

    profileId:
      nullableText(
        row.profileId,
      ),

    organizationId:
      nullableText(
        row.organizationId,
      ),

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


function mapAuthor(
  value: unknown,
): KoranaFeedAuthor {

  const row =
    record(value);


  return {
    id:
      text(row.id),

    type:
      actorType(row.type),

    handle:
      text(row.handle),

    displayName:
      text(
        row.displayName,
        "Utilisateur Indesy",
      ),

    avatarUrl:
      nullableText(
        row.avatarUrl,
      ),

    verified:
      bool(
        row.verified,
      ),

    followersCount:
      number(
        row.followersCount,
      ),
  };
}


function mapMedia(
  value: unknown,
): KoranaFeedMedia {

  const row =
    record(value);


  return {
    id:
      text(row.id),

    storagePath:
      text(
        row.storagePath,
      ),

    mediaType:
      row.mediaType === "video"
        ? "video"
        : "image",

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
      number(
        row.position,
      ),
  };
}


function mapCounts(
  value: unknown,
): KoranaFeedCounts {

  const row =
    record(value);


  return {
    comments:
      number(
        row.comments,
      ),

    reactions:
      number(
        row.reactions,
      ),

    reposts:
      number(
        row.reposts,
      ),
  };
}


function mapViewer(
  value: unknown,
): KoranaFeedViewerState {

  const row =
    record(value);


  return {
    isFollowingAuthor:
      bool(
        row.isFollowingAuthor,
      ),

    reactionType:
      reactionType(
        row.reactionType,
      ),

    saved:
      bool(
        row.saved,
      ),

    reposted:
      bool(
        row.reposted,
      ),
  };
}


function mapFeedItem(
  value: unknown,
): KoranaFeedItem {

  const row =
    record(value);


  const visibility =
    row.visibility ===
      "followers"
      ? "followers"
      : "public";


  const replyControl =
    row.replyControl ===
      "followers"
      ? "followers"
      : row.replyControl ===
          "mentioned"
        ? "mentioned"
        : "everyone";


  const activityType =
    row.activityType ===
      "repost"
      ? "repost" as const
      : "post" as const;


  const repostRow =
    record(
      row.repost,
    );


  const repost =
    activityType ===
      "repost" &&
    text(
      repostRow.id,
    )
      ? {
          id:
            text(
              repostRow.id,
            ),

          createdAt:
            text(
              repostRow.createdAt,
            ),

          by:
            mapAuthor(
              repostRow.by,
            ),
        }
      : null;


  return {

    feedEntryId:
      text(
        row.feedEntryId,
        `post:${text(row.id)}`,
      ),

    activityType,

    activityAt:
      nullableText(
        row.activityAt,
      ) ??
      nullableText(
        row.publishedAt,
      ) ??
      text(
        row.createdAt,
      ),

    repost,

    id:
      text(row.id),

    content:
      text(
        row.content,
      ),

    visibility,

    replyControl,

    linkedEntityType:
      nullableText(
        row.linkedEntityType,
      ),

    linkedEntityId:
      nullableText(
        row.linkedEntityId,
      ),

    publishedAt:
      nullableText(
        row.publishedAt,
      ),

    editedAt:
      nullableText(
        row.editedAt,
      ),

    createdAt:
      text(
        row.createdAt,
      ),

    updatedAt:
      text(
        row.updatedAt,
      ),

    author:
      mapAuthor(
        row.author,
      ),

    media:
      array(
        row.media,
      ).map(
        mapMedia,
      ),

    hashtags:
      array(
        row.hashtags,
      ).filter(
        (
          item,
        ): item is string =>
          typeof item ===
          "string",
      ),

    counts:
      mapCounts(
        row.counts,
      ),

    viewer:
      mapViewer(
        row.viewer,
      ),
  };
}


function mapSuggestion(
  value: unknown,
): KoranaActorSuggestion {

  const row =
    record(value);


  return {
    id:
      text(row.id),

    type:
      actorType(row.type),

    handle:
      text(row.handle),

    displayName:
      text(
        row.displayName,
        "Utilisateur Indesy",
      ),

    avatarUrl:
      nullableText(
        row.avatarUrl,
      ),

    verified:
      bool(
        row.verified,
      ),

    profileId:
      nullableText(
        row.profileId,
      ),

    organizationId:
      nullableText(
        row.organizationId,
      ),

    followersCount:
      number(
        row.followersCount,
      ),
  };
}


function mapHashtag(
  value: unknown,
): KoranaTrendingHashtag {

  const row =
    record(value);


  return {
    tag:
      text(
        row.tag,
      ),

    postsCount:
      number(
        row.postsCount,
      ),
  };
}


function mapPagination(
  value: unknown,
): KoranaFeedPagination {

  const row =
    record(value);


  return {
    limit:
      number(
        row.limit,
      ),

    nextBefore:
      nullableText(
        row.nextBefore,
      ),
  };
}


export class KoranaFeedRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async load(
    input:
      GetKoranaFeedInput,
  ): Promise<KoranaFeedSnapshot> {

    /*
     * Les arguments p_actor_id et p_before sont optionnels
     * dans le contrat généré par Supabase.
     *
     * Il faut donc envoyer `undefined` lorsqu'ils sont absents,
     * et non `null`.
     *
     * C'est important car :
     *
     * string | null
     * n'est pas compatible avec
     * string | undefined
     * dans TypeScript strict.
     */

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_feed_snapshot_v2",
        {
          p_mode:
            input.mode ??
            "for_you",

          p_actor_id:
            input.actorId ??
            undefined,

          p_limit:
            input.limit ??
            20,

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
      record(data);


    return {
      mode:
        feedMode(
          root.mode,
        ),

      currentActor:
        mapCurrentActor(
          root.currentActor,
        ),

      myActors:
        array(
          root.myActors,
        ).map(
          mapFeedActor,
        ),

      feed:
        array(
          root.feed,
        ).map(
          mapFeedItem,
        ),

      suggestions:
        array(
          root.suggestions,
        ).map(
          mapSuggestion,
        ),

      trendingHashtags:
        array(
          root.trendingHashtags,
        ).map(
          mapHashtag,
        ),

      pagination:
        mapPagination(
          root.pagination,
        ),
    };
  }
}