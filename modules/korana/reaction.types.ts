export type KoranaReactionType =
  | "like"
  | "support"
  | "respect"
  | "fire";


export interface KoranaSetPostReactionInput {
  actorId: string;

  postId: string;

  reactionType:
    KoranaReactionType;
}


export interface KoranaReactionBreakdown {
  like: number;

  support: number;

  respect: number;

  fire: number;
}


export interface KoranaPostReactionMutationResult {
  actorId: string;

  postId: string;

  reactionType:
    KoranaReactionType | null;

  reactionsCount: number;

  breakdown:
    KoranaReactionBreakdown;
}