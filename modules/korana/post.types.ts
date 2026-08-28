import type {
  KoranaPostStatus,
  KoranaPostVisibility,
  KoranaReplyControl,
} from "./types";


export interface CreateKoranaPostInput {
  actorId: string;

  content: string;

  visibility?:
    KoranaPostVisibility;

  replyControl?:
    KoranaReplyControl;

  hashtags?: string[];
}


export interface UpdateKoranaPostInput {
  postId: string;

  content: string;

  visibility?:
    KoranaPostVisibility;

  replyControl?:
    KoranaReplyControl;

  hashtags?: string[];
}


export interface KoranaPostMutationResult {
  id: string;

  authorActorId: string;

  content: string;

  visibility:
    KoranaPostVisibility;

  replyControl:
    KoranaReplyControl;

  status:
    KoranaPostStatus;

  publishedAt:
    string | null;

  editedAt:
    string | null;

  deletedAt:
    string | null;

  createdAt: string;

  updatedAt: string;

  hashtags: string[];
}