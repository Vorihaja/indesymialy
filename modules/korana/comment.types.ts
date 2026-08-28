export type KoranaCommentStatus =
  | "published"
  | "hidden"
  | "deleted";


export type KoranaCommentPermissionReason =
  | "authentication_required"
  | "actor_required"
  | "actor_forbidden"
  | "post_not_found"
  | "post_closed"
  | "post_forbidden"
  | "followers_only"
  | "mentioned_only";


export interface KoranaCommentAuthor {
  id: string;

  handle: string;

  displayName: string;

  avatarUrl:
    string | null;

  verified: boolean;
}


export interface KoranaCommentCounts {
  replies: number;

  reactions: number;
}


export interface KoranaCommentViewer {
  canManage: boolean;

  reactionType:
    string | null;
}


export interface KoranaCommentItem {
  id: string;

  postId: string;

  parentCommentId:
    string | null;

  content:
    string | null;

  status:
    KoranaCommentStatus;

  editedAt:
    string | null;

  createdAt: string;

  updatedAt: string;

  author:
    KoranaCommentAuthor | null;

  counts:
    KoranaCommentCounts;

  viewer:
    KoranaCommentViewer;
}


export interface KoranaCommentsSnapshot {
  postId: string;

  replyControl:
    | "everyone"
    | "followers"
    | "mentioned";

  canComment: boolean;

  canCommentReason:
    KoranaCommentPermissionReason | null;

  comments:
    KoranaCommentItem[];
}


export interface GetKoranaCommentsInput {
  postId: string;

  actorId:
    string | null;
}


export interface CreateKoranaCommentInput {
  actorId: string;

  postId: string;

  content: string;

  parentCommentId?:
    string | null;
}


export interface UpdateKoranaCommentInput {
  commentId: string;

  content: string;
}


export interface KoranaCommentMutationResult {
  id: string;

  postId: string;

  authorActorId: string;

  parentCommentId:
    string | null;

  content: string;

  status:
    KoranaCommentStatus;

  editedAt:
    string | null;

  deletedAt:
    string | null;

  createdAt: string;

  updatedAt: string;
}