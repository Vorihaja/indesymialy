export interface SetKoranaRepostInput {
  actorId: string;
  postId: string;
  reposted: boolean;
}


export interface KoranaRepostMutationResult {
  actorId: string;
  postId: string;
  reposted: boolean;
  repostsCount: number;
}