begin;


-- ============================================================
-- INDESY KORANA
-- K4-D.2 - REPOST FEED PROJECTION
--
-- Principles:
-- - keep K2 korana_feed_snapshot() untouched
-- - build a V2 projection on top of K2
-- - original post remains canonical
-- - repost becomes a social activity
-- - following feed includes reposts made by followed identities
-- - one visible feed entry per original post
-- - no deleted / hidden source post can leak through a repost
-- ============================================================


-- ============================================================
-- 1. CANONICAL POST JSON
--
-- Internal helper used when a repost introduces a post that is
-- not already present in the original K2 feed.
-- ============================================================

create or replace function
public._korana_feed_post_json(

    p_post_id uuid,

    p_actor_id uuid

)
returns jsonb

language plpgsql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_result jsonb;

begin

    select

        jsonb_build_object(


            'id',
                p.id,


            'content',
                p.content,


            'visibility',
                p.visibility,


            'replyControl',
                p.reply_control,


            'linkedEntityType',
                p.linked_entity_type,


            'linkedEntityId',
                p.linked_entity_id,


            'publishedAt',
                p.published_at,


            'editedAt',
                p.edited_at,


            'createdAt',
                p.created_at,


            'updatedAt',
                p.updated_at,


            'author',

                jsonb_build_object(

                    'id',
                        a.id,

                    'type',
                        a.actor_type,

                    'handle',
                        a.handle,

                    'displayName',
                        a.display_name,

                    'avatarUrl',
                        a.avatar_url,

                    'verified',
                        a.is_verified,

                    'followersCount',

                        (
                            select
                                count(*)

                            from
                                public.korana_follows follower_count

                            where
                                follower_count.followed_actor_id =
                                a.id
                        )

                ),


            'media',

                coalesce(

                    (

                        select
                            jsonb_agg(

                                jsonb_build_object(

                                    'id',
                                        m.id,

                                    'storagePath',
                                        m.storage_path,

                                    'mediaType',
                                        m.media_type,

                                    'mimeType',
                                        m.mime_type,

                                    'fileSizeBytes',
                                        m.file_size_bytes,

                                    'width',
                                        m.width_px,

                                    'height',
                                        m.height_px,

                                    'durationSeconds',
                                        m.duration_seconds,

                                    'altText',
                                        m.alt_text,

                                    'position',
                                        m.position

                                )

                                order by
                                    m.position,
                                    m.created_at,
                                    m.id

                            )

                        from
                            public.korana_post_media m

                        where
                            m.post_id =
                            p.id

                    ),

                    '[]'::jsonb

                ),


            'hashtags',

                coalesce(

                    (

                        select
                            jsonb_agg(
                                h.tag
                                order by h.tag
                            )

                        from
                            public.korana_post_hashtags ph

                        join
                            public.korana_hashtags h
                            on h.id =
                               ph.hashtag_id

                        where
                            ph.post_id =
                            p.id

                    ),

                    '[]'::jsonb

                ),


            'counts',

                jsonb_build_object(

                    'comments',

                        (
                            select
                                count(*)

                            from
                                public.korana_comments c

                            where
                                c.post_id =
                                p.id

                              and
                                c.status =
                                'published'
                        ),


                    'reactions',

                        (
                            select
                                count(*)

                            from
                                public.korana_reactions r

                            where
                                r.target_type =
                                'post'

                              and
                                r.post_id =
                                p.id
                        ),


                    'reposts',

                        (
                            select
                                count(*)

                            from
                                public.korana_reposts rp

                            where
                                rp.post_id =
                                p.id

                              and
                                rp.status =
                                'published'

                              and
                                rp.deleted_at
                                is null
                        )

                ),


            'viewer',

                jsonb_build_object(

                    'isFollowingAuthor',

                        exists (

                            select
                                1

                            from
                                public.korana_follows f

                            where
                                p_actor_id
                                is not null

                              and
                                f.follower_actor_id =
                                p_actor_id

                              and
                                f.followed_actor_id =
                                p.author_actor_id

                        ),


                    'reactionType',

                        (
                            select
                                r.reaction_type

                            from
                                public.korana_reactions r

                            where
                                p_actor_id
                                is not null

                              and
                                r.actor_id =
                                p_actor_id

                              and
                                r.target_type =
                                'post'

                              and
                                r.post_id =
                                p.id

                            limit 1
                        ),


                    'saved',

                        exists (

                            select
                                1

                            from
                                public.korana_saved_posts s

                            where
                                p_actor_id
                                is not null

                              and
                                s.actor_id =
                                p_actor_id

                              and
                                s.post_id =
                                p.id

                        ),


                    'reposted',

                        exists (

                            select
                                1

                            from
                                public.korana_reposts rp

                            where
                                p_actor_id
                                is not null

                              and
                                rp.actor_id =
                                p_actor_id

                              and
                                rp.post_id =
                                p.id

                              and
                                rp.status =
                                'published'

                              and
                                rp.deleted_at
                                is null

                        )

                )

        )

    into
        v_result


    from
        public.korana_posts p

    join
        public.korana_actors a
        on a.id =
           p.author_actor_id


    where
        p.id =
        p_post_id

      and
        p.status =
        'published'

      and
        p.published_at
        is not null

      and
        p.published_at <=
        now()

      and
        p.deleted_at
        is null

      and
        public.korana_can_view_post(
            p.id
        );


    return
        v_result;

end;

$function$;


revoke all
on function
public._korana_feed_post_json(
    uuid,
    uuid
)
from public, anon, authenticated;


-- ============================================================
-- 2. FEED V2
--
-- K2 remains the canonical base read model.
-- This RPC projects repost activities into it.
-- ============================================================

create or replace function
public.korana_feed_snapshot_v2(

    p_mode text
        default 'for_you',

    p_actor_id uuid
        default null,

    p_limit integer
        default 20,

    p_before timestamptz
        default null

)
returns jsonb

language plpgsql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_limit integer;

    v_candidate_limit integer;

    v_actor_id uuid;

    v_base jsonb;

    v_feed jsonb;

    v_next_before timestamptz;

begin

    -- ========================================================
    -- LIMIT
    -- ========================================================

    v_limit :=
        greatest(
            1,
            least(
                coalesce(
                    p_limit,
                    20
                ),
                50
            )
        );


    /*
     * Ask the K2 model for more candidates than the final
     * display limit so a deduplication against repost entries
     * does not unnecessarily shrink the visible page.
     */

    v_candidate_limit :=
        least(
            50,
            greatest(
                v_limit,
                v_limit * 2
            )
        );


    -- ========================================================
    -- BASE K2 SNAPSHOT
    -- ========================================================

    v_base :=
        public.korana_feed_snapshot(

            p_mode,

            p_actor_id,

            v_candidate_limit,

            p_before

        );


    -- ========================================================
    -- CURRENT SELECTED IDENTITY
    -- ========================================================

    begin

        v_actor_id :=
            nullif(
                v_base #>>
                '{currentActor,id}',
                ''
            )::uuid;

    exception

        when others then

            v_actor_id :=
                null;

    end;


    -- ========================================================
    -- MERGE:
    --
    -- BASE ITEM
    -- ----------
    -- activityType = post
    --
    -- REPOST ITEM
    -- -----------
    -- activityType = repost
    --
    -- Reposts introduced here are only from identities that
    -- the selected identity follows.
    --
    -- This keeps "Pour vous" useful and prevents unrelated
    -- public repost noise.
    -- ========================================================

    with base_candidates as (

        select

            (
                e.value ->>
                'id'
            )::uuid
                as post_id,


            coalesce(

                (
                    e.value ->>
                    'publishedAt'
                )::timestamptz,

                (
                    e.value ->>
                    'createdAt'
                )::timestamptz

            )
                as activity_at,


            case

                when
                    coalesce(
                        (
                            e.value #>>
                            '{viewer,isFollowingAuthor}'
                        )::boolean,
                        false
                    )

                    then 0

                else 1

            end
                as priority,


            1
                as kind_order,


            (
                'post:'
                ||
                (
                    e.value ->>
                    'id'
                )
            )
                as feed_entry_id,


            e.value
            ||
            jsonb_build_object(

                'feedEntryId',
                    (
                        'post:'
                        ||
                        (
                            e.value ->>
                            'id'
                        )
                    ),

                'activityType',
                    'post',

                'activityAt',

                    coalesce(

                        e.value ->
                        'publishedAt',

                        e.value ->
                        'createdAt'

                    ),

                'repost',
                    null

            )
                as item


        from
            jsonb_array_elements(

                coalesce(
                    v_base ->
                    'feed',
                    '[]'::jsonb
                )

            )
            as e(value)

    ),


    repost_candidates as (

        select

            rp.post_id,


            rp.created_at
                as activity_at,


            0
                as priority,


            0
                as kind_order,


            (
                'repost:'
                ||
                rp.id::text
            )
                as feed_entry_id,


            post_data.item
            ||
            jsonb_build_object(

                'feedEntryId',
                    (
                        'repost:'
                        ||
                        rp.id::text
                    ),

                'activityType',
                    'repost',

                'activityAt',
                    rp.created_at,

                'repost',

                    jsonb_build_object(

                        'id',
                            rp.id,

                        'createdAt',
                            rp.created_at,

                        'by',

                            jsonb_build_object(

                                'id',
                                    reposter.id,

                                'type',
                                    reposter.actor_type,

                                'handle',
                                    reposter.handle,

                                'displayName',
                                    reposter.display_name,

                                'avatarUrl',
                                    reposter.avatar_url,

                                'verified',
                                    reposter.is_verified,

                                'followersCount',

                                    (
                                        select
                                            count(*)

                                        from
                                            public.korana_follows fc

                                        where
                                            fc.followed_actor_id =
                                            reposter.id
                                    )

                            )

                    )

            )
                as item


        from
            public.korana_reposts rp

        join
            public.korana_actors reposter
            on reposter.id =
               rp.actor_id


        cross join lateral (

            select
                public._korana_feed_post_json(
                    rp.post_id,
                    v_actor_id
                )
                    as item

        ) post_data


        where

            v_actor_id
            is not null

          and
            rp.status =
            'published'

          and
            rp.deleted_at
            is null

          and
            public.korana_can_view_actor(
                rp.actor_id
            )

          and
            post_data.item
            is not null

          and
            (
                p_before
                is null

                or

                rp.created_at <
                p_before
            )

          and
            exists (

                select
                    1

                from
                    public.korana_follows f

                where
                    f.follower_actor_id =
                    v_actor_id

                  and
                    f.followed_actor_id =
                    rp.actor_id

            )


        order by
            rp.created_at desc,
            rp.id desc


        limit
            v_candidate_limit

    ),


    combined as (

        select
            post_id,
            activity_at,
            priority,
            kind_order,
            feed_entry_id,
            item

        from
            base_candidates


        union all


        select
            post_id,
            activity_at,
            priority,
            kind_order,
            feed_entry_id,
            item

        from
            repost_candidates

    ),


    ranked as (

        select

            c.*,


            row_number()
            over (

                partition by
                    c.post_id

                order by
                    c.priority,
                    c.activity_at desc,
                    c.kind_order,
                    c.feed_entry_id desc

            )
                as post_rank


        from
            combined c

    ),


    limited as (

        select
            *

        from
            ranked

        where
            post_rank =
            1

        order by
            priority,
            activity_at desc,
            kind_order,
            feed_entry_id desc

        limit
            v_limit

    )


    select

        coalesce(

            jsonb_agg(

                item

                order by
                    priority,
                    activity_at desc,
                    kind_order,
                    feed_entry_id desc

            ),

            '[]'::jsonb

        ),


        min(
            activity_at
        )


    into
        v_feed,
        v_next_before


    from
        limited;


    -- ========================================================
    -- RESPONSE
    -- ========================================================

    v_base :=
        jsonb_set(

            v_base,

            '{feed}',

            v_feed,

            true

        );


    v_base :=
        jsonb_set(

            v_base,

            '{pagination}',

            coalesce(
                v_base ->
                'pagination',
                '{}'::jsonb
            )

            ||

            jsonb_build_object(

                'limit',
                    v_limit,

                'nextBefore',
                    v_next_before

            ),

            true

        );


    return
        v_base;

end;

$function$;


revoke all
on function
public.korana_feed_snapshot_v2(
    text,
    uuid,
    integer,
    timestamptz
)
from public;


grant execute
on function
public.korana_feed_snapshot_v2(
    text,
    uuid,
    integer,
    timestamptz
)
to anon, authenticated;


comment on function
public.korana_feed_snapshot_v2(
    text,
    uuid,
    integer,
    timestamptz
)
is
'Indesy Korana K4-D.2 feed projection: original posts plus followed-identity repost activities.';


commit;