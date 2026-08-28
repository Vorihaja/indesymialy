import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  CreateKoranaCommentInput,
  GetKoranaCommentsInput,
  KoranaCommentMutationResult,
  KoranaCommentsSnapshot,
  UpdateKoranaCommentInput,
} from "../comment.types";


export class KoranaCommentRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async getComments(
    input:
      GetKoranaCommentsInput,
  ): Promise<KoranaCommentsSnapshot> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_comments_snapshot",
        {
          p_post_id:
            input.postId,

          p_actor_id:
            input.actorId ??
            undefined,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return data as unknown as
      KoranaCommentsSnapshot;
  }


  async createComment(
    input:
      CreateKoranaCommentInput,
  ): Promise<KoranaCommentMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_create_comment",
        {
          p_actor_id:
            input.actorId,

          p_post_id:
            input.postId,

          p_content:
            input.content,

          p_parent_comment_id:
            input.parentCommentId ??
            undefined,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return data as unknown as
      KoranaCommentMutationResult;
  }


  async updateComment(
    input:
      UpdateKoranaCommentInput,
  ): Promise<KoranaCommentMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_update_comment",
        {
          p_comment_id:
            input.commentId,

          p_content:
            input.content,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return data as unknown as
      KoranaCommentMutationResult;
  }


  async deleteComment(
    commentId:
      string,
  ): Promise<KoranaCommentMutationResult> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_delete_comment",
        {
          p_comment_id:
            commentId,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    return data as unknown as
      KoranaCommentMutationResult;
  }
}