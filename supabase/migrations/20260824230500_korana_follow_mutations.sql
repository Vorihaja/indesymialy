begin;


-- ============================================================
-- INDESY KORANA
-- K4-A - FOLLOW GRAPH MUTATIONS
--
-- The authenticated user may act only through an Actor that
-- they are genuinely allowed to manage.
--
-- The target Actor must also be visible to the caller.
-- ============================================================


create or replace function
public.korana_follow_actor(

    p_follower_actor_id uuid,

    p_followed_actor_id uuid

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

    v_follower_exists boolean;

    v_followed_exists boolean;

    v_follow_id uuid;

    v_followers_count bigint;

    v_following_count bigint;

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
    -- BASIC VALIDATION
    -- ========================================================

    if
        p_follower_actor_id
        is null

        or

        p_followed_actor_id
        is null
    then

        raise exception
            'KORANA_FOLLOW_ACTOR_REQUIRED';

    end if;


    if
        p_follower_actor_id =
        p_followed_actor_id
    then

        raise exception
            'KORANA_FOLLOW_SELF_NOT_ALLOWED';

    end if;


    -- ========================================================
    -- ACTOR EXISTENCE
    -- ========================================================

    select
        exists (
            select
                1

            from
                public.korana_actors a

            where
                a.id =
                p_follower_actor_id
        )

    into
        v_follower_exists;


    select
        exists (
            select
                1

            from
                public.korana_actors a

            where
                a.id =
                p_followed_actor_id
        )

    into
        v_followed_exists;


    if not
        v_follower_exists
    then

        raise exception
            'KORANA_FOLLOWER_ACTOR_NOT_FOUND';

    end if;


    if not
        v_followed_exists
    then

        raise exception
            'KORANA_FOLLOWED_ACTOR_NOT_FOUND';

    end if;


    -- ========================================================
    -- AUTHORIZATION
    -- ========================================================

    if not
        public.korana_can_manage_actor(
            p_follower_actor_id
        )
    then

        raise exception
            'KORANA_FOLLOWER_ACTOR_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    if not
        public.korana_can_view_actor(
            p_followed_actor_id
        )
    then

        raise exception
            'KORANA_FOLLOWED_ACTOR_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    -- ========================================================
    -- IDEMPOTENT FOLLOW
    -- ========================================================

    insert into
    public.korana_follows (

        follower_actor_id,

        followed_actor_id

    )

    values (

        p_follower_actor_id,

        p_followed_actor_id

    )

    on conflict (
        follower_actor_id,
        followed_actor_id
    )

    do update
    set
        follower_actor_id =
            excluded.follower_actor_id

    returning
        id

    into
        v_follow_id;


    -- ========================================================
    -- COUNTS
    -- ========================================================

    select
        count(*)

    into
        v_followers_count

    from
        public.korana_follows

    where
        followed_actor_id =
        p_followed_actor_id;


    select
        count(*)

    into
        v_following_count

    from
        public.korana_follows

    where
        follower_actor_id =
        p_follower_actor_id;


    return
        jsonb_build_object(

            'id',
                v_follow_id,

            'followerActorId',
                p_follower_actor_id,

            'followedActorId',
                p_followed_actor_id,

            'following',
                true,

            'followersCount',
                v_followers_count,

            'followingCount',
                v_following_count

        );

end;

$function$;


revoke all
on function
public.korana_follow_actor(
    uuid,
    uuid
)
from public, anon;


grant execute
on function
public.korana_follow_actor(
    uuid,
    uuid
)
to authenticated;



-- ============================================================
-- UNFOLLOW
-- ============================================================

create or replace function
public.korana_unfollow_actor(

    p_follower_actor_id uuid,

    p_followed_actor_id uuid

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

    v_followers_count bigint;

    v_following_count bigint;

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


    if
        p_follower_actor_id
        is null

        or

        p_followed_actor_id
        is null
    then

        raise exception
            'KORANA_FOLLOW_ACTOR_REQUIRED';

    end if;


    if not
        public.korana_can_manage_actor(
            p_follower_actor_id
        )
    then

        raise exception
            'KORANA_FOLLOWER_ACTOR_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    -- ========================================================
    -- IDEMPOTENT UNFOLLOW
    -- ========================================================

    delete from
        public.korana_follows

    where
        follower_actor_id =
        p_follower_actor_id

      and
        followed_actor_id =
        p_followed_actor_id;


    -- ========================================================
    -- COUNTS
    -- ========================================================

    select
        count(*)

    into
        v_followers_count

    from
        public.korana_follows

    where
        followed_actor_id =
        p_followed_actor_id;


    select
        count(*)

    into
        v_following_count

    from
        public.korana_follows

    where
        follower_actor_id =
        p_follower_actor_id;


    return
        jsonb_build_object(

            'followerActorId',
                p_follower_actor_id,

            'followedActorId',
                p_followed_actor_id,

            'following',
                false,

            'followersCount',
                v_followers_count,

            'followingCount',
                v_following_count

        );

end;

$function$;


revoke all
on function
public.korana_unfollow_actor(
    uuid,
    uuid
)
from public, anon;


grant execute
on function
public.korana_unfollow_actor(
    uuid,
    uuid
)
to authenticated;


comment on function
public.korana_follow_actor(
    uuid,
    uuid
)
is
'Indesy Korana K4-A: follow a visible Actor from an Actor controlled by the authenticated user.';


comment on function
public.korana_unfollow_actor(
    uuid,
    uuid
)
is
'Indesy Korana K4-A: stop following an Actor from an Actor controlled by the authenticated user.';


commit;