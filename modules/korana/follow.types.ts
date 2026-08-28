export interface KoranaFollowInput {
  followerActorId: string;

  followedActorId: string;
}


export interface KoranaFollowMutationResult {
  id?: string;

  followerActorId: string;

  followedActorId: string;

  following: boolean;

  followersCount: number;

  followingCount: number;
}