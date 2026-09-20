begin;


-- ============================================================
-- INDESY KORANA
-- K5-B1
--
-- PUBLIC PROFILE READ MODEL
--
-- Canonical identity:
--
-- profiles
--      ↓
-- korana_actors
--      ↓
-- korana_public_profile_snapshot(handle)
--
-- No duplicate profile table.
-- No direct application write.
-- Read-only RPC.
-- ============================================================


-- ============================================================
-- 1. CANONICAL PUBLIC POST JSON
--
-- Internal helper.
--
-- It deliberately returns the same main structure used by the
-- Korana Feed so the public profile UI can reuse Korana cards.
-- ============================================================

create or replace function
public._korana_public_profile_post_json(

    p_post_id uuid,

    p_viewer_actor_id uuid
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

    v_post
        public.korana_posts%rowtype;

    v_author
        public.korana_actors%rowtype;

    v_followers_count bigint :=
        0;

    v_comments_count bigint :=
        0;

    v_reactions_count bigint :=
        0;

    v_reposts_count bigint :=
        0;

    v_media jsonb :=
        '[]'::jsonb;

    v_hashtags jsonb :=
        '[]'::jsonb;

    v_reaction_type text;

    v_saved boolean :=
        false;

    v_reposted boolean :=
        false;

    v_following_author boolean :=
        false;

begin

    select
        p.*

    into
        v_post

    from
        public.korana_posts p

    where
        p.id =
        p_post_id

      and
        p.status =
        'published'

      and
        p.deleted_at
        is null

      and
        public.korana_can_view_post(
            p.id
        )

    limit 1;


    if not found then

        return
            null;

    end if;


    select
        a.*

    into
        v_author

    from
        public.korana_actors a

    where
        a.id =
        v_post.author_actor_id

    limit 1;


    if not found then

        return
            null;

    end if;


    -- ========================================================
    -- AUTHOR FOLLOWERS
    -- ========================================================

    select
        count(*)

    into
        v_followers_count

    from
        public.korana_follows f

    where
        f.followed_actor_id =
        v_author.id;


    -- ========================================================
    -- POST COUNTS
    -- ========================================================

    select
        count(*)

    into
        v_comments_count

    from
        public.korana_comments c

    where
        c.post_id =
        v_post.id

      and
        public.korana_can_view_comment(
            c.id
        );


    select
        count(*)

    into
        v_reactions_count

    from
        public.korana_reactions r

    where
        r.target_type =
        'post'

      and
        r.post_id =
        v_post.id;


    select
        count(*)

    into
        v_reposts_count

    from
        public.korana_reposts r

    where
        r.post_id =
        v_post.id

      and
        r.status =
        'published'

      and
        r.deleted_at
        is null;


    -- ========================================================
    -- MEDIA
    -- ========================================================

    select
        coalesce(

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

            ),

            '[]'::jsonb

        )

    into
        v_media

    from
        public.korana_post_media m

    where
        m.post_id =
        v_post.id;


    -- ========================================================
    -- HASHTAGS
    -- ========================================================

    select
        coalesce(

            jsonb_agg(
                h.tag
                order by
                    h.tag
            ),

            '[]'::jsonb

        )

    into
        v_hashtags

    from
        public.korana_post_hashtags ph

    join
        public.korana_hashtags h
        on h.id =
           ph.hashtag_id

    where
        ph.post_id =
        v_post.id;


    -- ========================================================
    -- VIEWER STATE
    -- ========================================================

    if
        p_viewer_actor_id
        is not null
    then

        select
            exists (

                select
                    1

                from
                    public.korana_follows f

                where
                    f.follower_actor_id =
                    p_viewer_actor_id

                  and
                    f.followed_actor_id =
                    v_author.id

            )

        into
            v_following_author;


        select
            r.reaction_type

        into
            v_reaction_type

        from
            public.korana_reactions r

        where
            r.actor_id =
            p_viewer_actor_id

          and
            r.target_type =
            'post'

          and
            r.post_id =
            v_post.id

        limit 1;


        select
            exists (

                select
                    1

                from
                    public.korana_saved_posts s

                where
                    s.actor_id =
                    p_viewer_actor_id

                  and
                    s.post_id =
                    v_post.id

            )

        into
            v_saved;


        select
            exists (

                select
                    1

                from
                    public.korana_reposts r

                where
                    r.actor_id =
                    p_viewer_actor_id

                  and
                    r.post_id =
                    v_post.id

                  and
                    r.status =
                    'published'

                  and
                    r.deleted_at
                    is null

            )

        into
            v_reposted;

    end if;


    -- ========================================================
    -- RESULT
    -- ========================================================

    return
        jsonb_build_object(

            'feedEntryId',
                'post:' ||
                v_post.id::text,

            'activityType',
                'post',

            'activityAt',
                coalesce(
                    v_post.published_at,
                    v_post.created_at
                ),

            'repost',
                null,

            'id',
                v_post.id,

            'content',
                v_post.content,

            'visibility',
                v_post.visibility,

            'replyControl',
                v_post.reply_control,

            'linkedEntityType',
                v_post.linked_entity_type,

            'linkedEntityId',
                v_post.linked_entity_id,

            'publishedAt',
                v_post.published_at,

            'editedAt',
                v_post.edited_at,

            'createdAt',
                v_post.created_at,

            'updatedAt',
                v_post.updated_at,

            'author',

                jsonb_build_object(

                    'id',
                        v_author.id,

                    'type',
                        v_author.actor_type,

                    'handle',
                        v_author.handle,

                    'displayName',
                        v_author.display_name,

                    'avatarUrl',
                        v_author.avatar_url,

                    'verified',
                        v_author.is_verified,

                    'followersCount',
                        v_followers_count

                ),

            'media',
                v_media,

            'hashtags',
                v_hashtags,

            'counts',

                jsonb_build_object(

                    'comments',
                        v_comments_count,

                    'reactions',
                        v_reactions_count,

                    'reposts',
                        v_reposts_count

                ),

            'viewer',

                jsonb_build_object(

                    'isFollowingAuthor',
                        v_following_author,

                    'reactionType',
                        v_reaction_type,

                    'saved',
                        v_saved,

                    'reposted',
                        v_reposted

                )

        );

end;

$function$;


revoke all
on function
public._korana_public_profile_post_json(
    uuid,
    uuid
)
from public, anon, authenticated;



-- ============================================================
-- 2. PUBLIC PROFILE SNAPSHOT
-- ============================================================

create or replace function
public.korana_public_profile_snapshot(

    p_handle text,

    p_viewer_actor_id uuid
        default null,

    p_limit integer
        default 20

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

    v_handle text;

    v_limit integer;

    v_actor
        public.korana_actors%rowtype;

    v_profile
        public.profiles%rowtype;

    v_organization
        public.organizations%rowtype;

    v_viewer_actor_id uuid;

    v_primary_role jsonb :=
        null;

    v_roles jsonb :=
        '[]'::jsonb;

    v_disciplines jsonb :=
        '[]'::jsonb;

    v_region jsonb :=
        null;

    v_city jsonb :=
        null;

    v_description text :=
        null;

    v_website text :=
        null;

    v_followers_count bigint :=
        0;

    v_following_count bigint :=
        0;

    v_posts_count bigint :=
        0;

    v_media_count bigint :=
        0;

    v_reposts_count bigint :=
        0;

    v_is_following boolean :=
        false;

    v_can_manage_target boolean :=
        false;

    v_can_follow boolean :=
        false;

    v_can_message boolean :=
        false;

    v_my_actors jsonb :=
        '[]'::jsonb;

    v_posts jsonb :=
        '[]'::jsonb;

begin

    -- ========================================================
    -- NORMALIZE HANDLE
    -- ========================================================

    v_handle :=
        lower(
            btrim(
                regexp_replace(
                    coalesce(
                        p_handle,
                        ''
                    ),
                    '^@+',
                    ''
                )
            )
        );


    if
        v_handle =
        ''
    then

        return
            jsonb_build_object(
                'found',
                false
            );

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
    -- TARGET ACTOR
    -- ========================================================

    select
        a.*

    into
        v_actor

    from
        public.korana_actors a

    where
        lower(
            a.handle
        ) =
        v_handle

      and
        a.status =
        'active'

      and
        public.korana_can_view_actor(
            a.id
        )

    limit 1;


    if not found then

        return
            jsonb_build_object(
                'found',
                false
            );

    end if;


    -- ========================================================
    -- VIEWER ACTOR
    --
    -- Explicit Actor is accepted only when the authenticated
    -- profile can manage it.
    --
    -- Otherwise the authenticated user's personal Actor
    -- becomes the default social identity.
    -- ========================================================

    if
        auth.uid()
        is not null
    then

        if
            p_viewer_actor_id
            is not null

            and

            public.korana_can_manage_actor(
                p_viewer_actor_id
            )
        then

            v_viewer_actor_id :=
                p_viewer_actor_id;

        else

            select
                a.id

            into
                v_viewer_actor_id

            from
                public.korana_actors a

            where
                a.actor_type =
                'profile'

              and
                a.profile_id =
                auth.uid()

              and
                a.status =
                'active'

            limit 1;

        end if;

    end if;


    -- ========================================================
    -- MY CONTROLLED ACTORS
    -- ========================================================

    if
        auth.uid()
        is not null
    then

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
                                v_viewer_actor_id
                            )

                    )

                    order by

                        case
                            when a.actor_type =
                            'profile'
                                then 0
                            else 1
                        end,

                        lower(
                            a.display_name
                        )

                ),

                '[]'::jsonb

            )

        into
            v_my_actors

        from
            public.korana_actors a

        where
            a.status =
            'active'

          and
            public.korana_can_manage_actor(
                a.id
            );

    end if;


    -- ========================================================
    -- UNIVERSAL PROFILE CONTEXT
    -- ========================================================

    if
        v_actor.actor_type =
        'profile'
    then

        select
            p.*

        into
            v_profile

        from
            public.profiles p

        where
            p.id =
            v_actor.profile_id

        limit 1;


        if
            v_profile.primary_role_id
            is not null
        then

            select
                jsonb_build_object(

                    'id',
                        r.id,

                    'slug',
                        r.slug,

                    'label',
                        r.label

                )

            into
                v_primary_role

            from
                public.roles r

            where
                r.id =
                v_profile.primary_role_id

            limit 1;

        end if;


        select
            coalesce(

                jsonb_agg(

                    jsonb_build_object(

                        'id',
                            r.id,

                        'slug',
                            r.slug,

                        'label',
                            r.label,

                        'primary',
                            (
                                r.id =
                                v_profile.primary_role_id
                            )

                    )

                    order by

                        case
                            when r.id =
                            v_profile.primary_role_id
                                then 0
                            else 1
                        end,

                        lower(
                            r.label
                        )

                ),

                '[]'::jsonb

            )

        into
            v_roles

        from
            public.profile_roles pr

        join
            public.roles r
            on r.id =
               pr.role_id

        where
            pr.profile_id =
            v_actor.profile_id;


        select
            coalesce(

                jsonb_agg(

                    jsonb_build_object(

                        'id',
                            d.id,

                        'name',
                            d.name

                    )

                    order by
                        lower(
                            d.name
                        )

                ),

                '[]'::jsonb

            )

        into
            v_disciplines

        from
            public.user_disciplines ud

        join
            public.disciplines d
            on d.id =
               ud.discipline_id

        where
            ud.user_id =
            v_actor.profile_id;


        if
            v_profile.region_id
            is not null
        then

            select
                jsonb_build_object(
                    'id',
                    r.id,
                    'name',
                    r.name
                )

            into
                v_region

            from
                public.regions r

            where
                r.id =
                v_profile.region_id

            limit 1;

        end if;


        if
            v_profile.city_id
            is not null
        then

            select
                jsonb_build_object(
                    'id',
                    c.id,
                    'name',
                    c.name
                )

            into
                v_city

            from
                public.cities c

            where
                c.id =
                v_profile.city_id

            limit 1;

        end if;


    -- ========================================================
    -- ORGANIZATION CONTEXT
    -- ========================================================

    else

        select
            o.*

        into
            v_organization

        from
            public.organizations o

        where
            o.id =
            v_actor.organization_id

        limit 1;


        if found then

            v_description :=
                v_organization.description;

            v_website :=
                v_organization.website;


            v_primary_role :=
                jsonb_build_object(

                    'id',
                        null,

                    'slug',
                        v_organization.type,

                    'label',
                        initcap(
                            replace(
                                v_organization.type,
                                '_',
                                ' '
                            )
                        )

                );


            if
                nullif(
                    btrim(
                        coalesce(
                            v_organization.discipline,
                            ''
                        )
                    ),
                    ''
                )
                is not null
            then

                v_disciplines :=
                    jsonb_build_array(

                        jsonb_build_object(

                            'id',
                                null,

                            'name',
                                v_organization.discipline

                        )

                    );

            end if;


            if
                v_organization.region_id
                is not null
            then

                select
                    jsonb_build_object(
                        'id',
                        r.id,
                        'name',
                        r.name
                    )

                into
                    v_region

                from
                    public.regions r

                where
                    r.id =
                    v_organization.region_id

                limit 1;

            end if;


            if
                v_organization.city_id
                is not null
            then

                select
                    jsonb_build_object(
                        'id',
                        c.id,
                        'name',
                        c.name
                    )

                into
                    v_city

                from
                    public.cities c

                where
                    c.id =
                    v_organization.city_id

                limit 1;

            end if;

        end if;

    end if;


    -- ========================================================
    -- SOCIAL COUNTS
    -- ========================================================

    select
        count(*)

    into
        v_followers_count

    from
        public.korana_follows f

    where
        f.followed_actor_id =
        v_actor.id;


    select
        count(*)

    into
        v_following_count

    from
        public.korana_follows f

    where
        f.follower_actor_id =
        v_actor.id;


    select
        count(*)

    into
        v_posts_count

    from
        public.korana_posts p

    where
        p.author_actor_id =
        v_actor.id

      and
        p.status =
        'published'

      and
        p.deleted_at
        is null

      and
        public.korana_can_view_post(
            p.id
        );


    select
        count(*)

    into
        v_media_count

    from
        public.korana_post_media m

    join
        public.korana_posts p
        on p.id =
           m.post_id

    where
        p.author_actor_id =
        v_actor.id

      and
        p.status =
        'published'

      and
        p.deleted_at
        is null

      and
        public.korana_can_view_post(
            p.id
        );


    select
        count(*)

    into
        v_reposts_count

    from
        public.korana_reposts r

    where
        r.actor_id =
        v_actor.id

      and
        r.status =
        'published'

      and
        r.deleted_at
        is null;


    -- ========================================================
    -- VIEWER RELATION
    -- ========================================================

    if
        auth.uid()
        is not null
    then

        v_can_manage_target :=
            public.korana_can_manage_actor(
                v_actor.id
            );

    end if;


    if
        v_viewer_actor_id
        is not null
    then

        select
            exists (

                select
                    1

                from
                    public.korana_follows f

                where
                    f.follower_actor_id =
                    v_viewer_actor_id

                  and
                    f.followed_actor_id =
                    v_actor.id

            )

        into
            v_is_following;

    end if;


    v_can_follow :=
        v_viewer_actor_id
        is not null

        and

        v_viewer_actor_id <>
        v_actor.id

        and

        not v_can_manage_target;


    /*
     * Communication P1 currently supports person-to-person
     * private conversations.
     *
     * Organization messaging will be enabled in its dedicated
     * Communication lot.
     */

    v_can_message :=
        auth.uid()
        is not null

        and

        v_actor.actor_type =
        'profile'

        and

        v_actor.profile_id
        is distinct from
        auth.uid();


    -- ========================================================
    -- LATEST POSTS
    -- ========================================================

    select
        coalesce(

            jsonb_agg(
                q.post_json
                order by
                    q.activity_at desc
            ),

            '[]'::jsonb

        )

    into
        v_posts

    from (

        select

            coalesce(
                p.published_at,
                p.created_at
            )
                as activity_at,

            public._korana_public_profile_post_json(
                p.id,
                v_viewer_actor_id
            )
                as post_json

        from
            public.korana_posts p

        where
            p.author_actor_id =
            v_actor.id

          and
            p.status =
            'published'

          and
            p.deleted_at
            is null

          and
            public.korana_can_view_post(
                p.id
            )

        order by
            coalesce(
                p.published_at,
                p.created_at
            )
            desc

        limit
            v_limit

    ) q

    where
        q.post_json
        is not null;


    -- ========================================================
    -- FINAL SNAPSHOT
    -- ========================================================

    return
        jsonb_build_object(

            'found',
                true,

            'actor',

                jsonb_build_object(

                    'id',
                        v_actor.id,

                    'type',
                        v_actor.actor_type,

                    'handle',
                        v_actor.handle,

                    'displayName',
                        v_actor.display_name,

                    'avatarUrl',
                        v_actor.avatar_url,

                    'verified',
                        v_actor.is_verified,

                    'visibility',
                        v_actor.visibility,

                    'status',
                        v_actor.status,

                    'profileId',
                        v_actor.profile_id,

                    'organizationId',
                        v_actor.organization_id

                ),

            'identity',

                jsonb_build_object(

                    'primaryRole',
                        v_primary_role,

                    'roles',
                        v_roles,

                    'disciplines',
                        v_disciplines,

                    'region',
                        v_region,

                    'city',
                        v_city,

                    'description',
                        v_description,

                    'website',
                        v_website

                ),

            'counts',

                jsonb_build_object(

                    'followers',
                        v_followers_count,

                    'following',
                        v_following_count,

                    'posts',
                        v_posts_count,

                    'media',
                        v_media_count,

                    'reposts',
                        v_reposts_count

                ),

            'viewer',

                jsonb_build_object(

                    'actorId',
                        v_viewer_actor_id,

                    'isFollowing',
                        v_is_following,

                    'canManage',
                        v_can_manage_target,

                    'canFollow',
                        v_can_follow,

                    'canMessage',
                        v_can_message

                ),

            'myActors',
                v_my_actors,

            'posts',
                v_posts

        );

end;

$function$;


revoke all
on function
public.korana_public_profile_snapshot(
    text,
    uuid,
    integer
)
from public;


grant execute
on function
public.korana_public_profile_snapshot(
    text,
    uuid,
    integer
)
to anon, authenticated;


comment on function
public.korana_public_profile_snapshot(
    text,
    uuid,
    integer
)
is
'Indesy Korana K5-B1: public Actor profile read model by canonical Korana handle.';


commit;