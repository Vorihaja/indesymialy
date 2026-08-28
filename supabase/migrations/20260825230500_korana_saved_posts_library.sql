begin;


-- ============================================================
-- INDESY KORANA
-- K4-E.2 - SAVED POSTS LIBRARY
--
-- Read-only library projection.
--
-- Principles:
-- - authenticated user only
-- - selected Korana identity
-- - one private saved library per identity
-- - source post must still be visible
-- - source post remains canonical
-- - newest saves first
-- - no direct DML
-- ============================================================


create or replace function
public.korana_saved_posts_snapshot(

    p_actor_id uuid
        default null,

    p_limit integer
        default 30,

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

    v_base jsonb;

    v_actor_id uuid;

    v_current_actor jsonb;

    v_my_actors jsonb;

    v_items jsonb;

    v_next_before timestamptz;

    v_total bigint := 0;

    v_has_more boolean := false;

begin

    -- ========================================================
    -- AUTH
    -- ========================================================

    if
        auth.uid()
        is null
    then

        raise exception
            'AUTHENTICATION_REQUIRED'
            using errcode =
            '42501';

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
                    30
                ),
                50
            )
        );


    -- ========================================================
    -- RESOLVE CURRENT KORANA IDENTITY
    --
    -- Reuse canonical Feed identity resolution so the library
    -- follows exactly the same ownership rules as Korana.
    -- ========================================================

    v_base :=
        public.korana_feed_snapshot_v2(

            'for_you',

            p_actor_id,

            1,

            null

        );


    v_current_actor :=
        v_base ->
        'currentActor';


    v_my_actors :=
        coalesce(
            v_base ->
            'myActors',
            '[]'::jsonb
        );


    begin

        v_actor_id :=
            nullif(
                v_current_actor ->>
                'id',
                ''
            )::uuid;

    exception

        when others then

            v_actor_id :=
                null;

    end;


    -- ========================================================
    -- NO KORANA IDENTITY
    -- ========================================================

    if
        v_actor_id
        is null
    then

        return
            jsonb_build_object(

                'currentActor',
                    v_current_actor,

                'myActors',
                    v_my_actors,

                'items',
                    '[]'::jsonb,

                'total',
                    0,

                'pagination',

                    jsonb_build_object(

                        'limit',
                            v_limit,

                        'nextBefore',
                            null,

                        'hasMore',
                            false

                    )

            );

    end if;


    -- ========================================================
    -- TOTAL VISIBLE SAVES
    -- ========================================================

    select
        count(*)

    into
        v_total

    from
        public.korana_saved_posts s

    join
        public.korana_posts p
        on p.id =
           s.post_id

    where
        s.actor_id =
        v_actor_id

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


    -- ========================================================
    -- SAVED ITEMS
    -- ========================================================

    with candidates as (

        select

            s.post_id,

            s.created_at
                as saved_at,

            post_data.item

        from
            public.korana_saved_posts s


        cross join lateral (

            select
                public._korana_feed_post_json(
                    s.post_id,
                    v_actor_id
                )
                    as item

        ) post_data


        where
            s.actor_id =
            v_actor_id

          and
            post_data.item
            is not null

          and
            (
                p_before
                is null

                or

                s.created_at <
                p_before
            )


        order by
            s.created_at desc,
            s.post_id desc


        limit
            v_limit

    )


    select

        coalesce(

            jsonb_agg(

                c.item

                ||

                jsonb_build_object(

                    'feedEntryId',
                        (
                            'saved:'
                            ||
                            c.post_id::text
                        ),

                    'activityType',
                        'post',

                    'activityAt',

                        coalesce(

                            c.item ->
                            'publishedAt',

                            c.item ->
                            'createdAt'

                        ),

                    'repost',
                        null,

                    'savedAt',
                        c.saved_at

                )

                order by
                    c.saved_at desc,
                    c.post_id desc

            ),

            '[]'::jsonb

        ),


        min(
            c.saved_at
        )


    into
        v_items,
        v_next_before


    from
        candidates c;


    -- ========================================================
    -- HAS MORE
    -- ========================================================

    if
        v_next_before
        is not null
    then

        select
            exists (

                select
                    1

                from
                    public.korana_saved_posts s

                join
                    public.korana_posts p
                    on p.id =
                       s.post_id

                where
                    s.actor_id =
                    v_actor_id

                  and
                    s.created_at <
                    v_next_before

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
                    )

            )

        into
            v_has_more;

    end if;


    -- ========================================================
    -- RESULT
    -- ========================================================

    return
        jsonb_build_object(

            'currentActor',
                v_current_actor,

            'myActors',
                v_my_actors,

            'items',
                v_items,

            'total',
                v_total,

            'pagination',

                jsonb_build_object(

                    'limit',
                        v_limit,

                    'nextBefore',
                        v_next_before,

                    'hasMore',
                        v_has_more

                )

        );

end;

$function$;


revoke all
on function
public.korana_saved_posts_snapshot(
    uuid,
    integer,
    timestamptz
)
from public, anon;


grant execute
on function
public.korana_saved_posts_snapshot(
    uuid,
    integer,
    timestamptz
)
to authenticated;


comment on function
public.korana_saved_posts_snapshot(
    uuid,
    integer,
    timestamptz
)
is
'Indesy Korana K4-E.2 private saved-post library snapshot for the selected Korana identity.';


commit;