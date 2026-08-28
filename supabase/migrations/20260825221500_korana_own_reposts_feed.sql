begin;


-- ============================================================
-- INDESY KORANA
-- K4-D.2.1
-- OWN REPOSTS IN "FOR YOU"
--
-- Rules:
--
-- FOR YOU
-- -------
-- - original K2 feed
-- - reposts from followed identities
-- - reposts made by the currently selected identity
--
-- FOLLOWING
-- ---------
-- - original K2 following feed
-- - reposts from followed identities
-- - own reposts are intentionally excluded
--
-- This allows the UI to legitimately display:
-- "Vous avez republié"
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

    v_mode text;

    v_limit integer;

    v_candidate_limit integer;

    v_actor_id uuid;

    v_base jsonb;

    v_feed jsonb;

    v_next_before timestamptz;

begin

    -- ========================================================
    -- MODE
    -- ========================================================

    v_mode :=
        lower(
            btrim(
                coalesce(
                    p_mode,
                    'for_you'
                )
            )
        );


    if
        v_mode not in (
            'for_you',
            'following'
        )
    then

        raise exception
            'Mode Korana invalide : %',
            v_mode;

    end if;


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


    v_candidate_limit :=
        least(
            50,
            greatest(
                v_limit,
                v_limit * 2
            )
        );


    -- ========================================================
    -- K2 BASE SNAPSHOT
    -- ========================================================

    v_base :=
        public.korana_feed_snapshot(

            v_mode,

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
    -- FEED CANDIDATES
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


            /*
             * Repost activity is socially relevant.
             *
             * Own repost and followed-identity repost both
             * receive priority 0.
             */

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
            (

                -- ============================================
                -- OWN REPOSTS
                --
                -- Visible only in "Pour vous".
                -- ============================================

                (

                    v_mode =
                    'for_you'

                    and

                    rp.actor_id =
                    v_actor_id

                )


                or


                -- ============================================
                -- FOLLOWED IDENTITY REPOSTS
                --
                -- Visible in both:
                -- - Pour vous
                -- - Abonnements
                -- ============================================

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
'Indesy Korana K4-D.2.1 feed projection: original posts, followed-identity reposts, and own reposts in For You.';


commit;