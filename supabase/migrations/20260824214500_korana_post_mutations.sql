begin;


-- ============================================================
-- INDESY KORANA
-- K3-A - SECURE POST MUTATIONS
--
-- - create
-- - update
-- - soft delete
-- - automatic hashtags
-- - explicit actor authorization
-- - no direct browser table mutation
-- ============================================================


-- ============================================================
-- 1. HASHTAG COLLECTION
-- ============================================================

create or replace function
public._korana_collect_hashtags(

    p_content text,

    p_hashtags text[]
        default '{}'::text[]

)
returns text[]

language sql
immutable

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

    with explicit_tags as (

        select
            lower(
                regexp_replace(
                    btrim(tag),
                    '^#+',
                    ''
                )
            ) as tag

        from
            unnest(
                coalesce(
                    p_hashtags,
                    '{}'::text[]
                )
            ) as tag

    ),

    content_tags as (

        select
            lower(
                (match_value)[1]
            ) as tag

        from
            regexp_matches(
                coalesce(
                    p_content,
                    ''
                ),
                '#([[:alnum:]_]{1,50})',
                'g'
            ) as match_value

    ),

    valid_tags as (

        select distinct
            source.tag

        from (

            select tag
            from explicit_tags

            union all

            select tag
            from content_tags

        ) source

        where
            char_length(
                source.tag
            )
            between 1 and 50

          and
            source.tag ~
            '^[[:alnum:]_]+$'

        order by
            source.tag

        limit 20

    )

    select
        coalesce(
            array_agg(
                tag
                order by tag
            ),
            '{}'::text[]
        )

    from
        valid_tags;

$function$;


revoke all
on function
public._korana_collect_hashtags(
    text,
    text[]
)
from public, anon, authenticated;


-- ============================================================
-- 2. SYNCHRONIZE POST HASHTAGS
-- ============================================================

create or replace function
public._korana_set_post_hashtags(

    p_post_id uuid,

    p_hashtags text[]

)
returns void

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

begin

    delete from
        public.korana_post_hashtags

    where
        post_id =
        p_post_id;


    if
        coalesce(
            array_length(
                p_hashtags,
                1
            ),
            0
        ) =
        0
    then

        return;

    end if;


    insert into
    public.korana_hashtags (
        tag
    )

    select distinct
        tag

    from
        unnest(
            p_hashtags
        ) as tag

    on conflict (
        tag
    )
    do nothing;


    insert into
    public.korana_post_hashtags (

        post_id,

        hashtag_id

    )

    select

        p_post_id,

        h.id

    from
        public.korana_hashtags h

    where
        h.tag =
        any(
            p_hashtags
        )

    on conflict
    do nothing;

end;

$function$;


revoke all
on function
public._korana_set_post_hashtags(
    uuid,
    text[]
)
from public, anon, authenticated;


-- ============================================================
-- 3. MUTATION RESULT
-- ============================================================

create or replace function
public._korana_post_mutation_result(
    p_post_id uuid
)
returns jsonb

language sql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

    select
        jsonb_build_object(

            'id',
                p.id,

            'authorActorId',
                p.author_actor_id,

            'content',
                p.content,

            'visibility',
                p.visibility,

            'replyControl',
                p.reply_control,

            'status',
                p.status,

            'publishedAt',
                p.published_at,

            'editedAt',
                p.edited_at,

            'deletedAt',
                p.deleted_at,

            'createdAt',
                p.created_at,

            'updatedAt',
                p.updated_at,

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

                )

        )

    from
        public.korana_posts p

    where
        p.id =
        p_post_id;

$function$;


revoke all
on function
public._korana_post_mutation_result(
    uuid
)
from public, anon, authenticated;


-- ============================================================
-- 4. CREATE POST
-- ============================================================

create or replace function
public.korana_create_post(

    p_actor_id uuid,

    p_content text,

    p_visibility text
        default 'public',

    p_reply_control text
        default 'everyone',

    p_hashtags text[]
        default '{}'::text[]

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

    v_content text;

    v_visibility text;

    v_reply_control text;

    v_hashtags text[];

    v_post_id uuid;

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
    -- CONTENT
    -- ========================================================

    v_content :=
        btrim(
            coalesce(
                p_content,
                ''
            )
        );


    if
        char_length(
            v_content
        ) =
        0
    then

        raise exception
            'KORANA_POST_CONTENT_REQUIRED';

    end if;


    if
        char_length(
            v_content
        ) >
        10000
    then

        raise exception
            'KORANA_POST_CONTENT_TOO_LONG';

    end if;


    -- ========================================================
    -- VISIBILITY
    -- ========================================================

    v_visibility :=
        lower(
            btrim(
                coalesce(
                    p_visibility,
                    'public'
                )
            )
        );


    if
        v_visibility not in (
            'public',
            'followers'
        )
    then

        raise exception
            'KORANA_POST_VISIBILITY_INVALID';

    end if;


    -- ========================================================
    -- REPLY CONTROL
    -- ========================================================

    v_reply_control :=
        lower(
            btrim(
                coalesce(
                    p_reply_control,
                    'everyone'
                )
            )
        );


    if
        v_reply_control not in (
            'everyone',
            'followers',
            'mentioned'
        )
    then

        raise exception
            'KORANA_REPLY_CONTROL_INVALID';

    end if;


    -- ========================================================
    -- HASHTAGS
    -- ========================================================

    v_hashtags :=
        public._korana_collect_hashtags(

            v_content,

            coalesce(
                p_hashtags,
                '{}'::text[]
            )

        );


    -- ========================================================
    -- INSERT
    -- ========================================================

    insert into
    public.korana_posts (

        author_actor_id,

        content,

        visibility,

        status,

        reply_control,

        published_at

    )

    values (

        p_actor_id,

        v_content,

        v_visibility,

        'published',

        v_reply_control,

        now()

    )

    returning
        id

    into
        v_post_id;


    perform
        public._korana_set_post_hashtags(

            v_post_id,

            v_hashtags

        );


    return
        public._korana_post_mutation_result(
            v_post_id
        );

end;

$function$;


revoke all
on function
public.korana_create_post(
    uuid,
    text,
    text,
    text,
    text[]
)
from public, anon;


grant execute
on function
public.korana_create_post(
    uuid,
    text,
    text,
    text,
    text[]
)
to authenticated;


-- ============================================================
-- 5. UPDATE POST
-- ============================================================

create or replace function
public.korana_update_post(

    p_post_id uuid,

    p_content text,

    p_visibility text
        default 'public',

    p_reply_control text
        default 'everyone',

    p_hashtags text[]
        default '{}'::text[]

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

    v_post public.korana_posts%rowtype;

    v_content text;

    v_visibility text;

    v_reply_control text;

    v_hashtags text[];

begin

    if
        auth.uid()
        is null
    then

        raise exception
            'AUTHENTICATION_REQUIRED'
            using errcode =
            '42501';

    end if;


    select
        *

    into
        v_post

    from
        public.korana_posts

    where
        id =
        p_post_id

    for update;


    if not found then

        raise exception
            'KORANA_POST_NOT_FOUND';

    end if;


    if not
        public.korana_can_manage_actor(
            v_post.author_actor_id
        )
    then

        raise exception
            'KORANA_POST_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    if
        v_post.status not in (
            'draft',
            'published'
        )
    then

        raise exception
            'KORANA_POST_NOT_EDITABLE';

    end if;


    v_content :=
        btrim(
            coalesce(
                p_content,
                ''
            )
        );


    if
        char_length(
            v_content
        ) =
        0
    then

        raise exception
            'KORANA_POST_CONTENT_REQUIRED';

    end if;


    if
        char_length(
            v_content
        ) >
        10000
    then

        raise exception
            'KORANA_POST_CONTENT_TOO_LONG';

    end if;


    v_visibility :=
        lower(
            btrim(
                coalesce(
                    p_visibility,
                    'public'
                )
            )
        );


    if
        v_visibility not in (
            'public',
            'followers'
        )
    then

        raise exception
            'KORANA_POST_VISIBILITY_INVALID';

    end if;


    v_reply_control :=
        lower(
            btrim(
                coalesce(
                    p_reply_control,
                    'everyone'
                )
            )
        );


    if
        v_reply_control not in (
            'everyone',
            'followers',
            'mentioned'
        )
    then

        raise exception
            'KORANA_REPLY_CONTROL_INVALID';

    end if;


    v_hashtags :=
        public._korana_collect_hashtags(

            v_content,

            coalesce(
                p_hashtags,
                '{}'::text[]
            )

        );


    update
        public.korana_posts

    set
        content =
            v_content,

        visibility =
            v_visibility,

        reply_control =
            v_reply_control,

        edited_at =
            now()

    where
        id =
        p_post_id;


    perform
        public._korana_set_post_hashtags(

            p_post_id,

            v_hashtags

        );


    return
        public._korana_post_mutation_result(
            p_post_id
        );

end;

$function$;


revoke all
on function
public.korana_update_post(
    uuid,
    text,
    text,
    text,
    text[]
)
from public, anon;


grant execute
on function
public.korana_update_post(
    uuid,
    text,
    text,
    text,
    text[]
)
to authenticated;


-- ============================================================
-- 6. SOFT DELETE POST
-- ============================================================

create or replace function
public.korana_delete_post(
    p_post_id uuid
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

    v_post public.korana_posts%rowtype;

begin

    if
        auth.uid()
        is null
    then

        raise exception
            'AUTHENTICATION_REQUIRED'
            using errcode =
            '42501';

    end if;


    select
        *

    into
        v_post

    from
        public.korana_posts

    where
        id =
        p_post_id

    for update;


    if not found then

        raise exception
            'KORANA_POST_NOT_FOUND';

    end if;


    if not
        public.korana_owns_actor(
            v_post.author_actor_id
        )
    then

        raise exception
            'KORANA_POST_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    if
        v_post.status =
        'deleted'
    then

        return
            public._korana_post_mutation_result(
                p_post_id
            );

    end if;


    if
        v_post.status =
        'hidden'
    then

        raise exception
            'KORANA_POST_MODERATION_LOCKED';

    end if;


    update
        public.korana_posts

    set
        status =
            'deleted',

        deleted_at =
            now(),

        edited_at =
            now()

    where
        id =
        p_post_id;


    return
        public._korana_post_mutation_result(
            p_post_id
        );

end;

$function$;


revoke all
on function
public.korana_delete_post(
    uuid
)
from public, anon;


grant execute
on function
public.korana_delete_post(
    uuid
)
to authenticated;


comment on function
public.korana_create_post(
    uuid,
    text,
    text,
    text,
    text[]
)
is
'Indesy Korana K3-A: create a published post for an actor controlled by the authenticated user.';


comment on function
public.korana_update_post(
    uuid,
    text,
    text,
    text,
    text[]
)
is
'Indesy Korana K3-A: update an editable post owned by the authenticated user.';


comment on function
public.korana_delete_post(
    uuid
)
is
'Indesy Korana K3-A: soft-delete an owned post.';


commit;