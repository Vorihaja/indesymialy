import type {
  Database,
  Json,
} from "@/infrastructure/supabase/database.types";


export type KoranaActorRow =
  Database["public"]["Tables"]["korana_actors"]["Row"];

export type KoranaPostRow =
  Database["public"]["Tables"]["korana_posts"]["Row"];

export type KoranaPostMediaRow =
  Database["public"]["Tables"]["korana_post_media"]["Row"];

export type KoranaFollowRow =
  Database["public"]["Tables"]["korana_follows"]["Row"];

export type KoranaCommentRow =
  Database["public"]["Tables"]["korana_comments"]["Row"];

export type KoranaReactionRow =
  Database["public"]["Tables"]["korana_reactions"]["Row"];

export type KoranaRepostRow =
  Database["public"]["Tables"]["korana_reposts"]["Row"];

export type KoranaSavedPostRow =
  Database["public"]["Tables"]["korana_saved_posts"]["Row"];

export type KoranaHashtagRow =
  Database["public"]["Tables"]["korana_hashtags"]["Row"];

export type KoranaMentionRow =
  Database["public"]["Tables"]["korana_mentions"]["Row"];

export type KoranaReportRow =
  Database["public"]["Tables"]["korana_reports"]["Row"];


export type KoranaActorType =
  "profile" |
  "organization";


export type KoranaActorVisibility =
  "public" |
  "private";


export type KoranaActorStatus =
  "active" |
  "disabled" |
  "suspended";


export type KoranaPostVisibility =
  "public" |
  "followers";


export type KoranaPostStatus =
  "draft" |
  "published" |
  "hidden" |
  "deleted";


export type KoranaReplyControl =
  "everyone" |
  "followers" |
  "mentioned";


export type KoranaReactionType =
  "like" |
  "support" |
  "respect" |
  "fire";


export interface KoranaFoundationActor {
  id: string;
  type: KoranaActorType;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  visibility: KoranaActorVisibility;
  status: KoranaActorStatus;
  profileId: string | null;
  organizationId: string | null;
}


export interface KoranaFoundationSnapshot {
  ready: boolean;

  actors: {
    total: number;
    profiles: number;
    organizations: number;
  };

  content: {
    posts: number;
    comments: number;
    reactions: number;
    reposts: number;
    follows: number;
  };

  myActors: KoranaFoundationActor[];

  storage: {
    bucket: string;
    public: boolean;
  };

  directWrites: boolean;
}


export type KoranaJson =
  Json;