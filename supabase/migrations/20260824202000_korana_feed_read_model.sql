begin;


-- ============================================================
-- INDESY KORANA
-- K2-A - FEED READ MODEL
--
-- Scope:
-- - current social actor
-- - owned actors
-- - "Pour vous" feed
-- - "Abonnements" feed
-- - actor suggestions
-- - trending hashtags
-- - engagement counters
-- - current-actor viewer state
--
-- READ ONLY.
-- Social mutations remain locked until K3 / K4.
-- ============================================================


create or replace function
public.korana_feed_snapshot(

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

    v_actor_id uuid;

    v_current_actor jsonb;

    v_my_actors jsonb;

    v_feed jsonb;

    v_suggestions jsonb;

    v_trending_hashtags jsonb;

    v_next_before timestamptz;

begin

    -- ========================================================
    -- INPUT NORMALIZATION
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


    -- ========================================================
    -- ACTIVE ACTOR
    -- ========================================================

    if
        auth.uid()
        is null
    then

        if
            p_actor_id
            is not null
        then

            raise exception
                'AUTHENTICATION_REQUIRED'
                using errcode =
                '42501';

        end if;


        v_actor_id :=
            null;

    else

        if
            p_actor_id
            is not null
        then

            if not
                public.korana_owns_actor(
                    p_actor_id
                )
            then

                raise exception
                    'KORANA_ACTOR_FORBIDDEN'
                    using errcode =
                    '42501';

            end if;


            v_actor_id :=
                p_actor_id;

        else

            select
                a.id

            into
                v_actor_id

            from
                public.korana_actors a

            where
                public.korana_owns_actor(
                    a.id
                )

            order by

                case
                    when
                        a.actor_type =
                        'profile'

                        then 0

                    else 1
                end,

                lower(
                    a.display_name
                ),

                a.id

            limit 1;

        end if;

    end if;


    -- ========================================================
    -- MY ACTORS
    -- ========================================================

    select
        coalesce(

            jsonb_agg(

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

                    'visibility',
                        a.visibility,

                    'status',
                        a.status,

                    'profileId',
                        a.profile_id,

                    'organizationId',
                        a.organization_id,

                    'isCurrent',
                        (
                            a.id =
                            v_actor_id
                        )

                )

                order by

                    case
                        when
                            a.actor_type =
                            'profile'

                            then 0

                        else 1
                    end,

                    lower(
                        a.display_name
                    ),

                    a.id

            ),

            '[]'::jsonb

        )

    into
        v_my_actors

    from
        public.korana_actors a

    where
        public.korana_owns_actor(
            a.id
        );


    -- ========================================================
    -- CURRENT ACTOR
    -- ========================================================

    select

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

            'visibility',
                a.visibility,

            'status',
                a.status,

            'profileId',
                a.profile_id,

            'organizationId',
                a.organization_id,

            'followersCount',

                (
                    select
                        count(*)

                    from
                        public.korana_follows f

                    where
                        f.followed_actor_id =
                        a.id
                ),

            'followingCount',

                (
                    select
                        count(*)

                    from
                        public.korana_follows f

                    where
                        f.follower_actor_id =
                        a.id
                )

        )

    into
        v_current_actor

    from
        public.korana_actors a

    where
        a.id =
        v_actor_id;


    -- ========================================================
    -- FEED
    --
    -- FOR YOU:
    -- 1. followed actors first
    -- 2. then recent visible content
    --
    -- FOLLOWING:
    -- only content from actors followed by the selected actor.
    --
    -- No opaque ranking algorithm is introduced here.
    -- ========================================================

    with base_feed as (

        select

            p.id,

            p.author_actor_id,

            p.content,

            p.visibility,

            p.reply_control,

            p.linked_entity_type,

            p.linked_entity_id,

            p.published_at,

            p.edited_at,

            p.created_at,

            p.updated_at,

            a.actor_type,

            a.handle,

            a.display_name,

            a.avatar_url,

            a.is_verified,

            exists (

                select
                    1

                from
                    public.korana_follows f

                where
                    v_actor_id
                    is not null

                  and
                    f.follower_actor_id =
                    v_actor_id

                  and
                    f.followed_actor_id =
                    p.author_actor_id

            )
                as is_following_author


        from
            public.korana_posts p

        join
            public.korana_actors a
            on a.id =
               p.author_actor_id


        where

            p.status =
            'published'

          and
            p.published_at
            is not null

          and
            p.published_at <=
            now()

          and
            (
                p_before
                is null

                or

                p.published_at <
                p_before
            )

          and
            public.korana_can_view_post(
                p.id
            )

          and
            (

                v_mode =
                'for_you'

                or

                (
                    v_mode =
                    'following'

                    and

                    v_actor_id
                    is not null

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
                            p.author_actor_id

                    )

                )

            )

    ),


    limited_feed as (

        select
            *

        from
            base_feed

        order by

            case

                when
                    v_mode =
                    'for_you'

                    and

                    is_following_author

                    then 0

                else 1

            end,

            published_at desc,

            id desc

        limit
            v_limit

    )


    select

        coalesce(

            jsonb_agg(

                jsonb_build_object(


                    'id',
                        f.id,


                    'content',
                        f.content,


                    'visibility',
                        f.visibility,


                    'replyControl',
                        f.reply_control,


                    'linkedEntityType',
                        f.linked_entity_type,


                    'linkedEntityId',
                        f.linked_entity_id,


                    'publishedAt',
                        f.published_at,


                    'editedAt',
                        f.edited_at,


                    'createdAt',
                        f.created_at,


                    'updatedAt',
                        f.updated_at,


                    'author',

                        jsonb_build_object(

                            'id',
                                f.author_actor_id,

                            'type',
                                f.actor_type,

                            'handle',
                                f.handle,

                            'displayName',
                                f.display_name,

                            'avatarUrl',
                                f.avatar_url,

                            'verified',
                                f.is_verified,

                            'followersCount',

                                (
                                    select
                                        count(*)

                                    from
                                        public.korana_follows follower_count

                                    where
                                        follower_count.followed_actor_id =
                                        f.author_actor_id
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
                                    f.id

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
                                    f.id

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
                                        f.id

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
                                        f.id
                                ),


                            'reposts',

                                (
                                    select
                                        count(*)

                                    from
                                        public.korana_reposts rp

                                    where
                                        rp.post_id =
                                        f.id

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
                                f.is_following_author,


                            'reactionType',

                                (
                                    select
                                        r.reaction_type

                                    from
                                        public.korana_reactions r

                                    where
                                        v_actor_id
                                        is not null

                                      and
                                        r.actor_id =
                                        v_actor_id

                                      and
                                        r.target_type =
                                        'post'

                                      and
                                        r.post_id =
                                        f.id

                                    limit 1
                                ),


                            'saved',

                                exists (

                                    select
                                        1

                                    from
                                        public.korana_saved_posts s

                                    where
                                        v_actor_id
                                        is not null

                                      and
                                        s.actor_id =
                                        v_actor_id

                                      and
                                        s.post_id =
                                        f.id

                                ),


                            'reposted',

                                exists (

                                    select
                                        1

                                    from
                                        public.korana_reposts rp

                                    where
                                        v_actor_id
                                        is not null

                                      and
                                        rp.actor_id =
                                        v_actor_id

                                      and
                                        rp.post_id =
                                        f.id

                                      and
                                        rp.status =
                                        'published'

                                      and
                                        rp.deleted_at
                                        is null

                                )

                        )

                )

                order by

                    case

                        when
                            v_mode =
                            'for_you'

                            and

                            f.is_following_author

                            then 0

                        else 1

                    end,

                    f.published_at desc,

                    f.id desc

            ),

            '[]'::jsonb

        ),

        min(
            f.published_at
        )

    into
        v_feed,
        v_next_before

    from
        limited_feed f;


    -- ========================================================
    -- ACTOR SUGGESTIONS
    --
    -- Real deterministic ordering:
    -- 1. verified
    -- 2. follower count
    -- 3. display name
    -- ========================================================

    with candidates as (

        select

            a.id,

            a.actor_type,

            a.handle,

            a.display_name,

            a.avatar_url,

            a.is_verified,

            a.profile_id,

            a.organization_id,

            (
                select
                    count(*)

                from
                    public.korana_follows follower_count

                where
                    follower_count.followed_actor_id =
                    a.id
            )
                as followers_count

        from
            public.korana_actors a

        where

            a.status =
            'active'

          and
            a.visibility =
            'public'

          and
            public.korana_can_view_actor(
                a.id
            )

          and
            not public.korana_owns_actor(
                a.id
            )

          and
            (

                v_actor_id
                is null

                or

                not exists (

                    select
                        1

                    from
                        public.korana_follows f

                    where
                        f.follower_actor_id =
                        v_actor_id

                      and
                        f.followed_actor_id =
                        a.id

                )

            )

    )


    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'id',
                        c.id,

                    'type',
                        c.actor_type,

                    'handle',
                        c.handle,

                    'displayName',
                        c.display_name,

                    'avatarUrl',
                        c.avatar_url,

                    'verified',
                        c.is_verified,

                    'profileId',
                        c.profile_id,

                    'organizationId',
                        c.organization_id,

                    'followersCount',
                        c.followers_count

                )

                order by

                    c.is_verified desc,

                    c.followers_count desc,

                    lower(
                        c.display_name
                    ),

                    c.id

            ),

            '[]'::jsonb

        )

    into
        v_suggestions

    from (

        select
            *

        from
            candidates

        order by

            is_verified desc,

            followers_count desc,

            lower(
                display_name
            ),

            id

        limit 6

    ) c;


    -- ========================================================
    -- TRENDING HASHTAGS
    --
    -- Only visible published content from the last 30 days.
    -- ========================================================

    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'tag',
                        q.tag,

                    'postsCount',
                        q.posts_count

                )

                order by

                    q.posts_count desc,

                    q.tag

            ),

            '[]'::jsonb

        )

    into
        v_trending_hashtags

    from (

        select

            h.tag,

            count(
                distinct p.id
            ) as posts_count


        from
            public.korana_hashtags h

        join
            public.korana_post_hashtags ph
            on ph.hashtag_id =
               h.id

        join
            public.korana_posts p
            on p.id =
               ph.post_id


        where

            p.status =
            'published'

          and
            p.published_at
            is not null

          and
            p.published_at >=
            now() -
            interval '30 days'

          and
            public.korana_can_view_post(
                p.id
            )


        group by
            h.id,
            h.tag


        order by

            posts_count desc,

            h.tag


        limit 8

    ) q;


    -- ========================================================
    -- RESPONSE
    -- ========================================================

    return
        jsonb_build_object(

            'mode',
                v_mode,

            'currentActor',
                v_current_actor,

            'myActors',
                v_my_actors,

            'feed',
                v_feed,

            'suggestions',
                v_suggestions,

            'trendingHashtags',
                v_trending_hashtags,

            'pagination',

                jsonb_build_object(

                    'limit',
                        v_limit,

                    'nextBefore',
                        v_next_before

                )

        );

end;

$function$;


revoke all
on function
public.korana_feed_snapshot(
    text,
    uuid,
    integer,
    timestamptz
)
from public;


grant execute
on function
public.korana_feed_snapshot(
    text,
    uuid,
    integer,
    timestamptz
)
to anon, authenticated;


comment on function
public.korana_feed_snapshot(
    text,
    uuid,
    integer,
    timestamptz
)
is
'Indesy Korana K2-A read model: actors, feed, suggestions and trending data. No social mutation.';


commit;