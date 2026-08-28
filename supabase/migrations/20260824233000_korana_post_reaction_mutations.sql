begin;


-- ============================================================
-- INDESY KORANA
-- K4-B - POST REACTIONS
--
-- Supported reactions:
-- like / support / respect / fire
--
-- Behaviour:
-- - no existing reaction -> create
-- - same reaction        -> remove
-- - different reaction   -> replace
--
-- One reaction per Actor and Post is already guaranteed by
-- korana_reactions_post_unique from K1.
-- ============================================================


create or replace function
public.korana_set_post_reaction(

    p_actor_id uuid,

    p_post_id uuid,

    p_reaction_type text

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

    v_existing_id uuid;

    v_existing_type text;

    v_current_type text;

    v_reactions_count bigint;

    v_like_count bigint;

    v_support_count bigint;

    v_respect_count bigint;

    v_fire_count bigint;

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
    -- INPUT
    -- ========================================================

    if
        p_actor_id
        is null
    then

        raise exception
            'KORANA_REACTION_ACTOR_REQUIRED';

    end if;


    if
        p_post_id
        is null
    then

        raise exception
            'KORANA_REACTION_POST_REQUIRED';

    end if;


    if
        p_reaction_type
        is null

        or

        p_reaction_type not in (
            'like',
            'support',
            'respect',
            'fire'
        )
    then

        raise exception
            'KORANA_REACTION_TYPE_INVALID';

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
            'KORANA_REACTION_ACTOR_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    -- ========================================================
    -- POST
    -- ========================================================

    if not exists (

        select
            1

        from
            public.korana_posts p

        where
            p.id =
            p_post_id

    )
    then

        raise exception
            'KORANA_REACTION_POST_NOT_FOUND';

    end if;


    if not
        public.korana_can_view_post(
            p_post_id
        )
    then

        raise exception
            'KORANA_REACTION_POST_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    -- ========================================================
    -- EXISTING REACTION
    -- ========================================================

    select
        r.id,
        r.reaction_type

    into
        v_existing_id,
        v_existing_type

    from
        public.korana_reactions r

    where
        r.target_type =
        'post'

      and
        r.actor_id =
        p_actor_id

      and
        r.post_id =
        p_post_id

    for update;


    -- ========================================================
    -- TOGGLE / REPLACE / CREATE
    -- ========================================================

    if
        v_existing_id
        is not null
    then

        if
            v_existing_type =
            p_reaction_type
        then

            delete from
                public.korana_reactions

            where
                id =
                v_existing_id;


            v_current_type :=
                null;

        else

            update
                public.korana_reactions

            set
                reaction_type =
                    p_reaction_type,

                created_at =
                    now()

            where
                id =
                v_existing_id;


            v_current_type :=
                p_reaction_type;

        end if;

    else

        insert into
        public.korana_reactions (

            actor_id,

            target_type,

            post_id,

            comment_id,

            reaction_type

        )

        values (

            p_actor_id,

            'post',

            p_post_id,

            null,

            p_reaction_type

        );


        v_current_type :=
            p_reaction_type;

    end if;


    -- ========================================================
    -- REAL COUNTS
    -- ========================================================

    select

        count(*),

        count(*) filter (
            where
                r.reaction_type =
                'like'
        ),

        count(*) filter (
            where
                r.reaction_type =
                'support'
        ),

        count(*) filter (
            where
                r.reaction_type =
                'respect'
        ),

        count(*) filter (
            where
                r.reaction_type =
                'fire'
        )

    into

        v_reactions_count,

        v_like_count,

        v_support_count,

        v_respect_count,

        v_fire_count

    from
        public.korana_reactions r

    where
        r.target_type =
        'post'

      and
        r.post_id =
        p_post_id;


    return
        jsonb_build_object(

            'actorId',
                p_actor_id,

            'postId',
                p_post_id,

            'reactionType',
                v_current_type,

            'reactionsCount',
                v_reactions_count,

            'breakdown',
                jsonb_build_object(

                    'like',
                        v_like_count,

                    'support',
                        v_support_count,

                    'respect',
                        v_respect_count,

                    'fire',
                        v_fire_count
                )

        );

end;

$function$;


revoke all
on function
public.korana_set_post_reaction(
    uuid,
    uuid,
    text
)
from public, anon;


grant execute
on function
public.korana_set_post_reaction(
    uuid,
    uuid,
    text
)
to authenticated;


comment on function
public.korana_set_post_reaction(
    uuid,
    uuid,
    text
)
is
'Indesy Korana K4-B: securely create, replace or toggle a post reaction for an Actor controlled by the authenticated user.';


commit;