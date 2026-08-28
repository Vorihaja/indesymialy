begin;


-- ============================================================
-- INDESY KORANA
-- K4-E.1 - SAVED POST MUTATIONS
--
-- Existing foundation:
-- - korana_saved_posts(actor_id, post_id)
-- - primary key prevents duplicates
-- - SELECT owner-only RLS
-- - direct DML revoked
-- - Feed viewer.saved already available
--
-- This migration adds only the secure mutation contract.
-- ============================================================


create or replace function
public.korana_set_saved_post(

    p_actor_id uuid,

    p_post_id uuid,

    p_saved boolean

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

    v_saved boolean;

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
        p_saved
        is null
    then

        raise exception
            'KORANA_SAVED_STATE_REQUIRED'
            using errcode =
            '22023';

    end if;


    -- ========================================================
    -- IDENTITY AUTHORIZATION
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
    -- POST MUST BE PUBLISHED AND CURRENTLY VIEWABLE
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
    -- APPLY DESIRED STATE
    -- ========================================================

    if
        p_saved
    then

        insert into
        public.korana_saved_posts (

            actor_id,

            post_id,

            created_at

        )

        values (

            p_actor_id,

            p_post_id,

            now()

        )

        on conflict (
            actor_id,
            post_id
        )

        do nothing;


    else

        delete from
            public.korana_saved_posts

        where
            actor_id =
            p_actor_id

          and
            post_id =
            p_post_id;

    end if;


    -- ========================================================
    -- REAL RESULT
    -- ========================================================

    select
        exists (

            select
                1

            from
                public.korana_saved_posts s

            where
                s.actor_id =
                p_actor_id

              and
                s.post_id =
                p_post_id

        )

    into
        v_saved;


    return
        jsonb_build_object(

            'actorId',
                p_actor_id,

            'postId',
                p_post_id,

            'saved',
                v_saved

        );

end;

$function$;


revoke all
on function
public.korana_set_saved_post(
    uuid,
    uuid,
    boolean
)
from public, anon;


grant execute
on function
public.korana_set_saved_post(
    uuid,
    uuid,
    boolean
)
to authenticated;


comment on function
public.korana_set_saved_post(
    uuid,
    uuid,
    boolean
)
is
'Indesy Korana K4-E.1 secure idempotent save/unsave post mutation.';


commit;