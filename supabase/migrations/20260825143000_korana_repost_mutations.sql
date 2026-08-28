begin;


-- ============================================================
-- INDESY KORANA
-- K4-D.1 - REPOST MUTATIONS
--
-- Existing foundation already provides:
-- - public.korana_reposts
-- - active partial unique index
-- - SELECT RLS
-- - Realtime
-- - Feed count
-- - viewer.reposted
--
-- This migration only exposes the secure mutation contract.
-- ============================================================


create or replace function
public.korana_set_repost(

    p_actor_id uuid,

    p_post_id uuid,

    p_reposted boolean

)
returns jsonb

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_post_exists boolean;

    v_active_repost_id uuid;

    v_reposts_count bigint;

begin

    -- ========================================================
    -- AUTHENTICATION
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
    -- INPUT
    -- ========================================================

    if
        p_actor_id
        is null
    then

        raise exception
            'KORANA_ACTOR_REQUIRED'
            using errcode =
            '22023';

    end if;


    if
        p_post_id
        is null
    then

        raise exception
            'KORANA_POST_REQUIRED'
            using errcode =
            '22023';

    end if;


    if
        p_reposted
        is null
    then

        raise exception
            'KORANA_REPOST_STATE_REQUIRED'
            using errcode =
            '22023';

    end if;


    -- ========================================================
    -- ACTOR AUTHORIZATION
    -- ========================================================

    if not
        public.korana_can_manage_actor(
            p_actor_id
        )
    then

        raise exception
            'KORANA_ACTOR_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    -- ========================================================
    -- POST AVAILABILITY
    --
    -- Important:
    -- korana_can_view_post() alone is not sufficient because
    -- an owner can view his own draft/deleted post.
    --
    -- A repost is only allowed for a real published post.
    -- ========================================================

    select
        exists (

            select
                1

            from
                public.korana_posts p

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
                )

        )

    into
        v_post_exists;


    if not
        v_post_exists
    then

        raise exception
            'KORANA_POST_UNAVAILABLE'
            using errcode =
            '42501';

    end if;


    -- ========================================================
    -- CURRENT ACTIVE REPOST
    -- ========================================================

    select
        rp.id

    into
        v_active_repost_id

    from
        public.korana_reposts rp

    where
        rp.actor_id =
        p_actor_id

      and
        rp.post_id =
        p_post_id

      and
        rp.status =
        'published'

      and
        rp.deleted_at
        is null

    order by
        rp.created_at desc,
        rp.id desc

    limit 1;


    -- ========================================================
    -- APPLY DESIRED STATE
    -- ========================================================

    if
        p_reposted
    then

        if
            v_active_repost_id
            is null
        then

            insert into
            public.korana_reposts (

                actor_id,

                post_id,

                commentary,

                status,

                created_at,

                deleted_at

            )

            values (

                p_actor_id,

                p_post_id,

                null,

                'published',

                now(),

                null

            );

        end if;


    else

        update
            public.korana_reposts

        set
            status =
                'deleted',

            deleted_at =
                now()

        where
            actor_id =
            p_actor_id

          and
            post_id =
            p_post_id

          and
            status =
            'published'

          and
            deleted_at
            is null;

    end if;


    -- ========================================================
    -- REAL COUNT
    -- ========================================================

    select
        count(*)

    into
        v_reposts_count

    from
        public.korana_reposts rp

    where
        rp.post_id =
        p_post_id

      and
        rp.status =
        'published'

      and
        rp.deleted_at
        is null;


    -- ========================================================
    -- RESPONSE
    -- ========================================================

    return
        jsonb_build_object(

            'actorId',
                p_actor_id,

            'postId',
                p_post_id,

            'reposted',
                p_reposted,

            'repostsCount',
                v_reposts_count

        );

end;

$function$;


revoke all
on function
public.korana_set_repost(
    uuid,
    uuid,
    boolean
)
from public, anon;


grant execute
on function
public.korana_set_repost(
    uuid,
    uuid,
    boolean
)
to authenticated;


comment on function
public.korana_set_repost(
    uuid,
    uuid,
    boolean
)
is
'Indesy Korana K4-D.1 secure idempotent repost/unrepost mutation.';


commit;