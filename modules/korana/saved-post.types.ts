import type {
  KoranaCurrentActor,
  KoranaFeedActor,
  KoranaFeedItem,
} from "./feed.types";


export interface SetKoranaSavedPostInput {
  actorId: string;

  postId: string;

  saved: boolean;
}


export interface KoranaSavedPostMutationResult {
  actorId: string;

  postId: string;

  saved: boolean;
}


export interface KoranaSavedLibraryItem
  extends KoranaFeedItem {

  savedAt: string;
}


export interface KoranaSavedPostsPagination {
  limit: number;

  nextBefore:
    string | null;

  hasMore: boolean;
}


export interface KoranaSavedPostsSnapshot {
  currentActor:
    KoranaCurrentActor | null;

  myActors:
    KoranaFeedActor[];

  items:
    KoranaSavedLibraryItem[];

  total: number;

  pagination:
    KoranaSavedPostsPagination;
}


export interface GetKoranaSavedPostsInput {
  actorId?:
    string | null;

  limit?:
    number;

  before?:
    string | null;
}