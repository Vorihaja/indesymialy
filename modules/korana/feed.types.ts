import type {
  KoranaActorStatus,
  KoranaActorType,
  KoranaActorVisibility,
  KoranaReactionType,
} from "./types";


export type KoranaFeedMode =
  | "for_you"
  | "following";


export type KoranaFeedActivityType =
  | "post"
  | "repost";


export interface KoranaFeedActor {
  id: string;

  type:
    KoranaActorType;

  handle: string;

  displayName: string;

  avatarUrl: string | null;

  verified: boolean;

  visibility:
    KoranaActorVisibility;

  status:
    KoranaActorStatus;

  profileId: string | null;

  organizationId: string | null;

  isCurrent: boolean;
}


export interface KoranaCurrentActor
  extends Omit<
    KoranaFeedActor,
    "isCurrent"
  > {

  followersCount: number;

  followingCount: number;
}


export interface KoranaFeedAuthor {
  id: string;

  type:
    KoranaActorType;

  handle: string;

  displayName: string;

  avatarUrl: string | null;

  verified: boolean;

  followersCount: number;
}


export interface KoranaFeedMedia {
  id: string;

  storagePath: string;

  mediaType:
    | "image"
    | "video";

  mimeType: string | null;

  fileSizeBytes: number | null;

  width: number | null;

  height: number | null;

  durationSeconds:
    number | null;

  altText: string | null;

  position: number;
}


export interface KoranaFeedCounts {
  comments: number;

  reactions: number;

  reposts: number;
}


export interface KoranaFeedViewerState {
  isFollowingAuthor: boolean;

  reactionType:
    KoranaReactionType | null;

  saved: boolean;

  reposted: boolean;
}


export interface KoranaFeedRepostContext {
  id: string;

  createdAt: string;

  by:
    KoranaFeedAuthor;
}


export interface KoranaFeedItem {

  /*
   * Unique Feed activity key.
   *
   * Examples:
   * post:<post-id>
   * repost:<repost-id>
   *
   * The canonical post id remains `id`.
   */

  feedEntryId: string;

  activityType:
    KoranaFeedActivityType;

  activityAt: string;

  repost:
    KoranaFeedRepostContext | null;


  id: string;

  content: string;

  visibility:
    "public" |
    "followers";

  replyControl:
    "everyone" |
    "followers" |
    "mentioned";

  linkedEntityType:
    string | null;

  linkedEntityId:
    string | null;

  publishedAt:
    string | null;

  editedAt:
    string | null;

  createdAt: string;

  updatedAt: string;

  author:
    KoranaFeedAuthor;

  media:
    KoranaFeedMedia[];

  hashtags: string[];

  counts:
    KoranaFeedCounts;

  viewer:
    KoranaFeedViewerState;
}


export interface KoranaActorSuggestion {
  id: string;

  type:
    KoranaActorType;

  handle: string;

  displayName: string;

  avatarUrl: string | null;

  verified: boolean;

  profileId: string | null;

  organizationId:
    string | null;

  followersCount: number;
}


export interface KoranaTrendingHashtag {
  tag: string;

  postsCount: number;
}


export interface KoranaFeedPagination {
  limit: number;

  nextBefore:
    string | null;
}


export interface KoranaFeedSnapshot {
  mode:
    KoranaFeedMode;

  currentActor:
    KoranaCurrentActor | null;

  myActors:
    KoranaFeedActor[];

  feed:
    KoranaFeedItem[];

  suggestions:
    KoranaActorSuggestion[];

  trendingHashtags:
    KoranaTrendingHashtag[];

  pagination:
    KoranaFeedPagination;
}


export interface GetKoranaFeedInput {
  mode?:
    KoranaFeedMode;

  actorId?:
    string | null;

  limit?:
    number;

  before?:
    string | null;
}