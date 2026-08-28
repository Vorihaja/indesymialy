begin;


-- ============================================================
-- INDESY KORANA
-- K1 - SOCIAL FOUNDATION
--
-- PRINCIPLES
-- ------------------------------------------------------------
-- - shared Indesy identity
-- - no duplicate authentication
-- - no duplicate messaging
-- - actors represent profiles or organizations
-- - private Storage bucket
-- - real PostgreSQL data only
-- - RLS from day one
-- - direct application DML intentionally locked
-- - future writes go through secure RPCs
-- ============================================================


-- ============================================================
-- 1. KORANA ACTORS
-- ============================================================

create table
public.korana_actors (

    id uuid primary key
        default gen_random_uuid(),

    actor_type text not null,

    profile_id uuid unique
        references public.profiles(id)
        on delete cascade,

    organization_id uuid unique
        references public.organizations(id)
        on delete cascade,

    handle text not null unique,

    display_name text not null,

    avatar_url text,

    is_verified boolean not null
        default false,

    visibility text not null
        default 'public',

    status text not null
        default 'active',

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    korana_actors_type_check
    check (
        actor_type in (
            'profile',
            'organization'
        )
    ),

    constraint
    korana_actors_identity_check
    check (

        (
            actor_type =
            'profile'

            and

            profile_id is not null

            and

            organization_id is null
        )

        or

        (
            actor_type =
            'organization'

            and

            profile_id is null

            and

            organization_id is not null
        )

    ),

    constraint
    korana_actors_visibility_check
    check (
        visibility in (
            'public',
            'private'
        )
    ),

    constraint
    korana_actors_status_check
    check (
        status in (
            'active',
            'disabled',
            'suspended'
        )
    ),

    constraint
    korana_actors_handle_check
    check (
        handle ~
        '^[a-z0-9][a-z0-9._-]{2,49}$'
    ),

    constraint
    korana_actors_name_check
    check (
        char_length(
            btrim(
                display_name
            )
        ) >=
        1
    )
);


create index
korana_actors_type_status_idx

on public.korana_actors(
    actor_type,
    status
);


create index
korana_actors_display_name_idx

on public.korana_actors(
    lower(
        display_name
    )
);


-- ============================================================
-- 2. POSTS
-- ============================================================

create table
public.korana_posts (

    id uuid primary key
        default gen_random_uuid(),

    author_actor_id uuid not null
        references public.korana_actors(id)
        on delete restrict,

    content text not null
        default '',

    visibility text not null
        default 'public',

    status text not null
        default 'draft',

    reply_control text not null
        default 'everyone',

    linked_entity_type text,

    linked_entity_id uuid,

    published_at timestamptz,

    edited_at timestamptz,

    deleted_at timestamptz,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    korana_posts_content_length_check
    check (
        char_length(
            content
        ) <=
        10000
    ),

    constraint
    korana_posts_visibility_check
    check (
        visibility in (
            'public',
            'followers'
        )
    ),

    constraint
    korana_posts_status_check
    check (
        status in (
            'draft',
            'published',
            'hidden',
            'deleted'
        )
    ),

    constraint
    korana_posts_reply_control_check
    check (
        reply_control in (
            'everyone',
            'followers',
            'mentioned'
        )
    ),

    constraint
    korana_posts_entity_type_check
    check (
        linked_entity_type is null

        or

        linked_entity_type in (
            'fighter',
            'club',
            'event',
            'organization',
            'discipline'
        )
    ),

    constraint
    korana_posts_entity_pair_check
    check (

        (
            linked_entity_type is null
            and
            linked_entity_id is null
        )

        or

        (
            linked_entity_type is not null
            and
            linked_entity_id is not null
        )

    )
);


create index
korana_posts_feed_idx

on public.korana_posts(
    status,
    published_at desc
);


create index
korana_posts_author_idx

on public.korana_posts(
    author_actor_id,
    published_at desc
);


create index
korana_posts_created_idx

on public.korana_posts(
    created_at desc
);


create index
korana_posts_linked_entity_idx

on public.korana_posts(
    linked_entity_type,
    linked_entity_id
);


-- ============================================================
-- 3. POST MEDIA
-- ============================================================

create table
public.korana_post_media (

    id uuid primary key
        default gen_random_uuid(),

    post_id uuid not null
        references public.korana_posts(id)
        on delete cascade,

    storage_path text not null unique,

    media_type text not null,

    mime_type text,

    file_size_bytes bigint,

    width_px integer,

    height_px integer,

    duration_seconds numeric,

    alt_text text,

    position integer not null
        default 0,

    created_at timestamptz not null
        default now(),

    constraint
    korana_post_media_type_check
    check (
        media_type in (
            'image',
            'video'
        )
    ),

    constraint
    korana_post_media_size_check
    check (
        file_size_bytes is null
        or
        file_size_bytes >= 0
    ),

    constraint
    korana_post_media_position_check
    check (
        position >= 0
    )
);


create index
korana_post_media_post_idx

on public.korana_post_media(
    post_id,
    position
);


-- ============================================================
-- 4. FOLLOW GRAPH
-- ============================================================

create table
public.korana_follows (

    id uuid primary key
        default gen_random_uuid(),

    follower_actor_id uuid not null
        references public.korana_actors(id)
        on delete cascade,

    followed_actor_id uuid not null
        references public.korana_actors(id)
        on delete cascade,

    created_at timestamptz not null
        default now(),

    constraint
    korana_follows_not_self_check
    check (
        follower_actor_id <>
        followed_actor_id
    ),

    constraint
    korana_follows_unique
    unique (
        follower_actor_id,
        followed_actor_id
    )
);


create index
korana_follows_followed_idx

on public.korana_follows(
    followed_actor_id,
    created_at desc
);


create index
korana_follows_follower_idx

on public.korana_follows(
    follower_actor_id,
    created_at desc
);


-- ============================================================
-- 5. COMMENTS / REPLIES
-- ============================================================

create table
public.korana_comments (

    id uuid primary key
        default gen_random_uuid(),

    post_id uuid not null
        references public.korana_posts(id)
        on delete cascade,

    author_actor_id uuid not null
        references public.korana_actors(id)
        on delete restrict,

    parent_comment_id uuid
        references public.korana_comments(id)
        on delete cascade,

    content text not null,

    status text not null
        default 'published',

    edited_at timestamptz,

    deleted_at timestamptz,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    korana_comments_content_check
    check (
        char_length(
            btrim(
                content
            )
        )
        between 1 and 5000
    ),

    constraint
    korana_comments_status_check
    check (
        status in (
            'published',
            'hidden',
            'deleted'
        )
    )
);


create index
korana_comments_post_idx

on public.korana_comments(
    post_id,
    created_at
);


create index
korana_comments_parent_idx

on public.korana_comments(
    parent_comment_id,
    created_at
);


create index
korana_comments_author_idx

on public.korana_comments(
    author_actor_id,
    created_at desc
);


-- ============================================================
-- 6. REACTIONS
-- ============================================================

create table
public.korana_reactions (

    id uuid primary key
        default gen_random_uuid(),

    actor_id uuid not null
        references public.korana_actors(id)
        on delete cascade,

    target_type text not null,

    post_id uuid
        references public.korana_posts(id)
        on delete cascade,

    comment_id uuid
        references public.korana_comments(id)
        on delete cascade,

    reaction_type text not null
        default 'like',

    created_at timestamptz not null
        default now(),

    constraint
    korana_reactions_target_type_check
    check (
        target_type in (
            'post',
            'comment'
        )
    ),

    constraint
    korana_reactions_reaction_type_check
    check (
        reaction_type in (
            'like',
            'support',
            'respect',
            'fire'
        )
    ),

    constraint
    korana_reactions_target_check
    check (

        (
            target_type =
            'post'

            and

            post_id is not null

            and

            comment_id is null
        )

        or

        (
            target_type =
            'comment'

            and

            post_id is null

            and

            comment_id is not null
        )

    )
);


create unique index
korana_reactions_post_unique

on public.korana_reactions(
    actor_id,
    post_id
)

where
    target_type =
    'post';


create unique index
korana_reactions_comment_unique

on public.korana_reactions(
    actor_id,
    comment_id
)

where
    target_type =
    'comment';


create index
korana_reactions_post_idx

on public.korana_reactions(
    post_id,
    reaction_type
)

where
    target_type =
    'post';


create index
korana_reactions_comment_idx

on public.korana_reactions(
    comment_id,
    reaction_type
)

where
    target_type =
    'comment';


-- ============================================================
-- 7. REPOSTS
-- ============================================================

create table
public.korana_reposts (

    id uuid primary key
        default gen_random_uuid(),

    actor_id uuid not null
        references public.korana_actors(id)
        on delete cascade,

    post_id uuid not null
        references public.korana_posts(id)
        on delete cascade,

    commentary text,

    status text not null
        default 'published',

    created_at timestamptz not null
        default now(),

    deleted_at timestamptz,

    constraint
    korana_reposts_status_check
    check (
        status in (
            'published',
            'deleted'
        )
    ),

    constraint
    korana_reposts_commentary_check
    check (
        commentary is null

        or

        char_length(
            commentary
        ) <=
        2000
    )
);


create unique index
korana_reposts_active_unique

on public.korana_reposts(
    actor_id,
    post_id
)

where
    deleted_at is null;


create index
korana_reposts_post_idx

on public.korana_reposts(
    post_id,
    created_at desc
);


-- ============================================================
-- 8. SAVED POSTS
-- ============================================================

create table
public.korana_saved_posts (

    actor_id uuid not null
        references public.korana_actors(id)
        on delete cascade,

    post_id uuid not null
        references public.korana_posts(id)
        on delete cascade,

    created_at timestamptz not null
        default now(),

    primary key (
        actor_id,
        post_id
    )
);


create index
korana_saved_posts_actor_idx

on public.korana_saved_posts(
    actor_id,
    created_at desc
);


-- ============================================================
-- 9. HASHTAGS
-- ============================================================

create table
public.korana_hashtags (

    id uuid primary key
        default gen_random_uuid(),

    tag text not null unique,

    created_at timestamptz not null
        default now(),

    constraint
    korana_hashtags_tag_check
    check (
        char_length(tag)
        between 1 and 50

        and

        tag ~
        '^[[:alnum:]_]+$'
    )
);


create table
public.korana_post_hashtags (

    post_id uuid not null
        references public.korana_posts(id)
        on delete cascade,

    hashtag_id uuid not null
        references public.korana_hashtags(id)
        on delete cascade,

    created_at timestamptz not null
        default now(),

    primary key (
        post_id,
        hashtag_id
    )
);


create index
korana_post_hashtags_hashtag_idx

on public.korana_post_hashtags(
    hashtag_id,
    post_id
);


-- ============================================================
-- 10. MENTIONS
-- ============================================================

create table
public.korana_mentions (

    id uuid primary key
        default gen_random_uuid(),

    mentioned_actor_id uuid not null
        references public.korana_actors(id)
        on delete cascade,

    target_type text not null,

    post_id uuid
        references public.korana_posts(id)
        on delete cascade,

    comment_id uuid
        references public.korana_comments(id)
        on delete cascade,

    created_at timestamptz not null
        default now(),

    constraint
    korana_mentions_target_type_check
    check (
        target_type in (
            'post',
            'comment'
        )
    ),

    constraint
    korana_mentions_target_check
    check (

        (
            target_type =
            'post'

            and

            post_id is not null

            and

            comment_id is null
        )

        or

        (
            target_type =
            'comment'

            and

            post_id is null

            and

            comment_id is not null
        )

    )
);


create unique index
korana_mentions_post_unique

on public.korana_mentions(
    mentioned_actor_id,
    post_id
)

where
    target_type =
    'post';


create unique index
korana_mentions_comment_unique

on public.korana_mentions(
    mentioned_actor_id,
    comment_id
)

where
    target_type =
    'comment';


-- ============================================================
-- 11. REPORTS
-- ============================================================

create table
public.korana_reports (

    id uuid primary key
        default gen_random_uuid(),

    reporter_actor_id uuid not null
        references public.korana_actors(id)
        on delete restrict,

    target_type text not null,

    target_actor_id uuid
        references public.korana_actors(id)
        on delete cascade,

    post_id uuid
        references public.korana_posts(id)
        on delete cascade,

    comment_id uuid
        references public.korana_comments(id)
        on delete cascade,

    reason_category text not null,

    details text,

    status text not null
        default 'open',

    resolved_by_profile_id uuid
        references public.profiles(id)
        on delete set null,

    resolved_at timestamptz,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    korana_reports_target_type_check
    check (
        target_type in (
            'actor',
            'post',
            'comment'
        )
    ),

    constraint
    korana_reports_reason_check
    check (
        reason_category in (
            'spam',
            'harassment',
            'hate',
            'violence',
            'misinformation',
            'impersonation',
            'privacy',
            'other'
        )
    ),

    constraint
    korana_reports_status_check
    check (
        status in (
            'open',
            'reviewing',
            'resolved',
            'dismissed'
        )
    ),

    constraint
    korana_reports_details_check
    check (
        details is null

        or

        char_length(
            details
        ) <=
        4000
    ),

    constraint
    korana_reports_target_check
    check (

        (
            target_type =
            'actor'

            and

            target_actor_id is not null

            and

            post_id is null

            and

            comment_id is null
        )

        or

        (
            target_type =
            'post'

            and

            target_actor_id is null

            and

            post_id is not null

            and

            comment_id is null
        )

        or

        (
            target_type =
            'comment'

            and

            target_actor_id is null

            and

            post_id is null

            and

            comment_id is not null
        )

    )
);


create index
korana_reports_status_idx

on public.korana_reports(
    status,
    created_at desc
);


create index
korana_reports_reporter_idx

on public.korana_reports(
    reporter_actor_id,
    created_at desc
);


-- ============================================================
-- 12. MODERATION ACTIONS
--
-- No end-user policies.
-- K8 will expose secured Admin operations.
-- ============================================================

create table
public.korana_moderation_actions (

    id uuid primary key
        default gen_random_uuid(),

    report_id uuid
        references public.korana_reports(id)
        on delete set null,

    moderator_profile_id uuid not null
        references public.profiles(id)
        on delete restrict,

    target_type text not null,

    target_actor_id uuid
        references public.korana_actors(id)
        on delete cascade,

    post_id uuid
        references public.korana_posts(id)
        on delete cascade,

    comment_id uuid
        references public.korana_comments(id)
        on delete cascade,

    action text not null,

    reason text not null,

    metadata jsonb not null
        default '{}'::jsonb,

    created_at timestamptz not null
        default now(),

    constraint
    korana_moderation_target_type_check
    check (
        target_type in (
            'actor',
            'post',
            'comment'
        )
    ),

    constraint
    korana_moderation_action_check
    check (
        action in (
            'warn',
            'hide',
            'remove',
            'restore',
            'restrict_author'
        )
    ),

    constraint
    korana_moderation_reason_check
    check (
        char_length(
            btrim(
                reason
            )
        )
        between 3 and 2000
    ),

    constraint
    korana_moderation_target_check
    check (

        (
            target_type =
            'actor'

            and

            target_actor_id is not null

            and

            post_id is null

            and

            comment_id is null
        )

        or

        (
            target_type =
            'post'

            and

            target_actor_id is null

            and

            post_id is not null

            and

            comment_id is null
        )

        or

        (
            target_type =
            'comment'

            and

            target_actor_id is null

            and

            post_id is null

            and

            comment_id is not null
        )

    )
);


create index
korana_moderation_actions_target_idx

on public.korana_moderation_actions(
    target_type,
    created_at desc
);


-- ============================================================
-- 13. FEED PREFERENCES
-- ============================================================

create table
public.korana_feed_preferences (

    profile_id uuid primary key
        references public.profiles(id)
        on delete cascade,

    feed_mode text not null
        default 'balanced',

    preferred_region_id uuid
        references public.regions(id)
        on delete set null,

    preferred_discipline_id uuid
        references public.disciplines(id)
        on delete set null,

    show_sensitive boolean not null
        default false,

    updated_at timestamptz not null
        default now(),

    constraint
    korana_feed_preferences_mode_check
    check (
        feed_mode in (
            'balanced',
            'following',
            'discover'
        )
    )
);


-- ============================================================
-- 14. GENERIC UPDATED_AT TRIGGER
-- ============================================================

create or replace function
public._korana_touch_updated_at()
returns trigger

language plpgsql

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

begin

    new.updated_at =
        now();

    return
        new;

end;

$function$;


revoke all
on function
public._korana_touch_updated_at()
from public, anon, authenticated;


create trigger
korana_actors_touch_updated_at

before update
on public.korana_actors

for each row
execute function
public._korana_touch_updated_at();


create trigger
korana_posts_touch_updated_at

before update
on public.korana_posts

for each row
execute function
public._korana_touch_updated_at();


create trigger
korana_comments_touch_updated_at

before update
on public.korana_comments

for each row
execute function
public._korana_touch_updated_at();


create trigger
korana_reports_touch_updated_at

before update
on public.korana_reports

for each row
execute function
public._korana_touch_updated_at();


create trigger
korana_feed_preferences_touch_updated_at

before update
on public.korana_feed_preferences

for each row
execute function
public._korana_touch_updated_at();


-- ============================================================
-- 15. COMMENT PARENT INTEGRITY
-- ============================================================

create or replace function
public._korana_validate_comment_parent()
returns trigger

language plpgsql

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_parent_post_id uuid;

begin

    if
        new.parent_comment_id is null
    then

        return
            new;

    end if;


    if
        new.parent_comment_id =
        new.id
    then

        raise exception
            'Un commentaire ne peut pas être sa propre réponse.';

    end if;


    select
        post_id

    into
        v_parent_post_id

    from
        public.korana_comments

    where
        id =
        new.parent_comment_id;


    if
        v_parent_post_id is null
    then

        raise exception
            'Commentaire parent introuvable.';

    end if;


    if
        v_parent_post_id <>
        new.post_id
    then

        raise exception
            'Le commentaire parent appartient à une autre publication.';

    end if;


    return
        new;

end;

$function$;


revoke all
on function
public._korana_validate_comment_parent()
from public, anon, authenticated;


create trigger
korana_comments_validate_parent

before insert or update of
    parent_comment_id,
    post_id

on public.korana_comments

for each row
execute function
public._korana_validate_comment_parent();


-- ============================================================
-- 16. HANDLE HELPERS
-- ============================================================

create or replace function
public._korana_handle_base(

    p_value text,

    p_prefix text,

    p_entity_id uuid

)
returns text

language plpgsql
immutable

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_value text;

begin

    v_value :=
        lower(
            btrim(
                coalesce(
                    p_value,
                    ''
                )
            )
        );


    v_value :=
        regexp_replace(
            v_value,
            '[^a-z0-9._-]+',
            '-',
            'g'
        );


    v_value :=
        regexp_replace(
            v_value,
            '^[^a-z0-9]+',
            '',
            'g'
        );


    v_value :=
        regexp_replace(
            v_value,
            '[^a-z0-9]+$',
            '',
            'g'
        );


    if
        char_length(
            v_value
        ) <
        3
    then

        v_value :=
            lower(
                p_prefix
            )
            ||
            '-'
            ||
            left(
                replace(
                    p_entity_id::text,
                    '-',
                    ''
                ),
                12
            );

    end if;


    return
        left(
            v_value,
            50
        );

end;

$function$;


revoke all
on function
public._korana_handle_base(
    text,
    text,
    uuid
)
from public, anon, authenticated;


create or replace function
public._korana_allocate_handle(

    p_base text,

    p_entity_id uuid,

    p_existing_actor_id uuid
        default null

)
returns text

language plpgsql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_candidate text;

begin

    v_candidate :=
        left(
            p_base,
            50
        );


    if not exists (

        select
            1

        from
            public.korana_actors a

        where
            a.handle =
            v_candidate

          and
            (
                p_existing_actor_id is null

                or

                a.id <>
                p_existing_actor_id
            )

    )
    then

        return
            v_candidate;

    end if;


    v_candidate :=
        left(
            p_base,
            37
        )
        ||
        '-'
        ||
        left(
            replace(
                p_entity_id::text,
                '-',
                ''
            ),
            12
        );


    if not exists (

        select
            1

        from
            public.korana_actors a

        where
            a.handle =
            v_candidate

          and
            (
                p_existing_actor_id is null

                or

                a.id <>
                p_existing_actor_id
            )

    )
    then

        return
            v_candidate;

    end if;


    return
        left(
            p_base,
            17
        )
        ||
        '-'
        ||
        replace(
            p_entity_id::text,
            '-',
            ''
        );

end;

$function$;


revoke all
on function
public._korana_allocate_handle(
    text,
    uuid,
    uuid
)
from public, anon, authenticated;


-- ============================================================
-- 17. PROFILE ACTOR SYNCHRONIZATION
-- ============================================================

create or replace function
public._korana_sync_profile_actor(
    p_profile_id uuid
)
returns uuid

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_profile public.profiles%rowtype;

    v_actor_id uuid;

    v_existing_handle text;

    v_handle text;

begin

    select
        *

    into
        v_profile

    from
        public.profiles

    where
        id =
        p_profile_id;


    if not found then

        return
            null;

    end if;


    select
        id,
        handle

    into
        v_actor_id,
        v_existing_handle

    from
        public.korana_actors

    where
        profile_id =
        p_profile_id;


    if
        v_actor_id is null
    then

        v_handle :=
            public._korana_handle_base(
                v_profile.username,
                'user',
                v_profile.id
            );


        v_handle :=
            public._korana_allocate_handle(
                v_handle,
                v_profile.id,
                null
            );


        insert into
        public.korana_actors (

            actor_type,

            profile_id,

            handle,

            display_name,

            avatar_url,

            is_verified,

            visibility,

            status

        )

        values (

            'profile',

            v_profile.id,

            v_handle,

            v_profile.full_name,

            v_profile.photo_url,

            coalesce(
                v_profile.is_verified,
                false
            ),

            'public',

            case
                when
                    v_profile.deactivated_at
                    is null

                    then 'active'

                else 'disabled'
            end

        )

        returning
            id

        into
            v_actor_id;


    else

        update
            public.korana_actors

        set
            display_name =
                v_profile.full_name,

            avatar_url =
                v_profile.photo_url,

            is_verified =
                coalesce(
                    v_profile.is_verified,
                    false
                ),

            status =
                case
                    when
                        v_profile.deactivated_at
                        is null

                        then
                            case
                                when status =
                                'suspended'
                                    then 'suspended'

                                else 'active'
                            end

                    else 'disabled'
                end,

            updated_at =
                now()

        where
            id =
            v_actor_id;

    end if;


    return
        v_actor_id;

end;

$function$;


revoke all
on function
public._korana_sync_profile_actor(
    uuid
)
from public, anon, authenticated;


create or replace function
public._korana_profile_actor_trigger()
returns trigger

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

begin

    perform
        public._korana_sync_profile_actor(
            new.id
        );


    return
        new;

end;

$function$;


revoke all
on function
public._korana_profile_actor_trigger()
from public, anon, authenticated;


create trigger
korana_profiles_actor_sync

after insert or update of
    full_name,
    photo_url,
    is_verified,
    deactivated_at

on public.profiles

for each row
execute function
public._korana_profile_actor_trigger();


-- ============================================================
-- 18. ORGANIZATION ACTOR SYNCHRONIZATION
-- ============================================================

create or replace function
public._korana_sync_organization_actor(
    p_organization_id uuid
)
returns uuid

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_organization public.organizations%rowtype;

    v_actor_id uuid;

    v_handle text;

begin

    select
        *

    into
        v_organization

    from
        public.organizations

    where
        id =
        p_organization_id;


    if not found then

        return
            null;

    end if;


    select
        id

    into
        v_actor_id

    from
        public.korana_actors

    where
        organization_id =
        p_organization_id;


    if
        v_actor_id is null
    then

        v_handle :=
            public._korana_handle_base(

                coalesce(
                    v_organization.slug,
                    v_organization.name
                ),

                'org',

                v_organization.id
            );


        v_handle :=
            public._korana_allocate_handle(
                v_handle,
                v_organization.id,
                null
            );


        insert into
        public.korana_actors (

            actor_type,

            organization_id,

            handle,

            display_name,

            avatar_url,

            is_verified,

            visibility,

            status

        )

        values (

            'organization',

            v_organization.id,

            v_handle,

            v_organization.name,

            v_organization.logo_url,

            coalesce(
                v_organization.is_verified,
                false
            ),

            'public',

            case
                when
                    v_organization.deactivated_at
                    is null

                    then 'active'

                else 'disabled'
            end

        )

        returning
            id

        into
            v_actor_id;


    else

        update
            public.korana_actors

        set
            display_name =
                v_organization.name,

            avatar_url =
                v_organization.logo_url,

            is_verified =
                coalesce(
                    v_organization.is_verified,
                    false
                ),

            status =
                case
                    when
                        v_organization.deactivated_at
                        is null

                        then
                            case
                                when status =
                                'suspended'
                                    then 'suspended'

                                else 'active'
                            end

                    else 'disabled'
                end,

            updated_at =
                now()

        where
            id =
            v_actor_id;

    end if;


    return
        v_actor_id;

end;

$function$;


revoke all
on function
public._korana_sync_organization_actor(
    uuid
)
from public, anon, authenticated;


create or replace function
public._korana_organization_actor_trigger()
returns trigger

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

begin

    perform
        public._korana_sync_organization_actor(
            new.id
        );


    return
        new;

end;

$function$;


revoke all
on function
public._korana_organization_actor_trigger()
from public, anon, authenticated;


create trigger
korana_organizations_actor_sync

after insert or update of
    name,
    logo_url,
    is_verified,
    deactivated_at

on public.organizations

for each row
execute function
public._korana_organization_actor_trigger();


-- ============================================================
-- 19. BACKFILL EXISTING INDESY IDENTITIES
-- ============================================================

do $backfill$

declare

    v_profile record;

    v_organization record;

begin

    for
        v_profile

    in
        select id
        from public.profiles
        order by created_at, id

    loop

        perform
            public._korana_sync_profile_actor(
                v_profile.id
            );

    end loop;


    for
        v_organization

    in
        select id
        from public.organizations
        order by created_at, id

    loop

        perform
            public._korana_sync_organization_actor(
                v_organization.id
            );

    end loop;

end;

$backfill$;


-- ============================================================
-- 20. ACTOR OWNERSHIP
--
-- Organization authorization deliberately mirrors the existing
-- Indesy organization-management convention:
-- owner / admin / manager / organizer + active membership.
-- ============================================================

create or replace function
public.korana_owns_actor(
    p_actor_id uuid
)
returns boolean

language sql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

    select

        auth.uid()
        is not null

        and

        exists (

            select
                1

            from
                public.korana_actors a

            where
                a.id =
                p_actor_id

              and
                (

                    a.profile_id =
                    auth.uid()

                    or

                    (

                        a.organization_id
                        is not null

                        and

                        exists (

                            select
                                1

                            from
                                public.organizations o

                            where
                                o.id =
                                a.organization_id

                              and
                                o.owner_id =
                                auth.uid()

                        )

                    )

                    or

                    (

                        a.organization_id
                        is not null

                        and

                        exists (

                            select
                                1

                            from
                                public.organization_members om

                            where
                                om.organization_id =
                                a.organization_id

                              and
                                om.profile_id =
                                auth.uid()

                              and
                                om.role in (
                                    'owner',
                                    'admin',
                                    'manager',
                                    'organizer'
                                )

                              and
                                coalesce(
                                    om.status,
                                    'active'
                                ) =
                                'active'

                        )

                    )

                )

        );

$function$;


revoke all
on function
public.korana_owns_actor(
    uuid
)
from public, anon;


grant execute
on function
public.korana_owns_actor(
    uuid
)
to authenticated;


create or replace function
public.korana_can_manage_actor(
    p_actor_id uuid
)
returns boolean

language sql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

    select

        public.korana_owns_actor(
            p_actor_id
        )

        and

        exists (

            select
                1

            from
                public.korana_actors a

            where
                a.id =
                p_actor_id

              and
                a.status =
                'active'

        );

$function$;


revoke all
on function
public.korana_can_manage_actor(
    uuid
)
from public, anon;


grant execute
on function
public.korana_can_manage_actor(
    uuid
)
to authenticated;


-- ============================================================
-- 21. ACTOR VISIBILITY
-- ============================================================

create or replace function
public.korana_can_view_actor(
    p_actor_id uuid
)
returns boolean

language sql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

    select

        exists (

            select
                1

            from
                public.korana_actors a

            where
                a.id =
                p_actor_id

              and
                (

                    public.korana_owns_actor(
                        a.id
                    )

                    or

                    (
                        a.status =
                        'active'

                        and

                        a.visibility =
                        'public'
                    )

                )

        );

$function$;


revoke all
on function
public.korana_can_view_actor(
    uuid
)
from public;


grant execute
on function
public.korana_can_view_actor(
    uuid
)
to anon, authenticated;


-- ============================================================
-- 22. POST VISIBILITY
-- ============================================================

create or replace function
public.korana_can_view_post(
    p_post_id uuid
)
returns boolean

language sql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

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
                (

                    public.korana_owns_actor(
                        p.author_actor_id
                    )

                    or

                    (

                        p.status =
                        'published'

                        and

                        p.published_at
                        is not null

                        and

                        p.published_at <=
                        now()

                        and

                        public.korana_can_view_actor(
                            p.author_actor_id
                        )

                        and

                        (

                            p.visibility =
                            'public'

                            or

                            (

                                p.visibility =
                                'followers'

                                and

                                exists (

                                    select
                                        1

                                    from
                                        public.korana_follows f

                                    where
                                        f.followed_actor_id =
                                        p.author_actor_id

                                      and
                                        public.korana_owns_actor(
                                            f.follower_actor_id
                                        )

                                )

                            )

                        )

                    )

                )

        );

$function$;


revoke all
on function
public.korana_can_view_post(
    uuid
)
from public;


grant execute
on function
public.korana_can_view_post(
    uuid
)
to anon, authenticated;


-- ============================================================
-- 23. COMMENT VISIBILITY
-- ============================================================

create or replace function
public.korana_can_view_comment(
    p_comment_id uuid
)
returns boolean

language sql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

    select

        exists (

            select
                1

            from
                public.korana_comments c

            where
                c.id =
                p_comment_id

              and
                (

                    public.korana_owns_actor(
                        c.author_actor_id
                    )

                    or

                    (

                        c.status =
                        'published'

                        and

                        public.korana_can_view_post(
                            c.post_id
                        )

                    )

                )

        );

$function$;


revoke all
on function
public.korana_can_view_comment(
    uuid
)
from public;


grant execute
on function
public.korana_can_view_comment(
    uuid
)
to anon, authenticated;


-- ============================================================
-- 24. RLS
-- ============================================================

alter table public.korana_actors
enable row level security;

alter table public.korana_posts
enable row level security;

alter table public.korana_post_media
enable row level security;

alter table public.korana_follows
enable row level security;

alter table public.korana_comments
enable row level security;

alter table public.korana_reactions
enable row level security;

alter table public.korana_reposts
enable row level security;

alter table public.korana_saved_posts
enable row level security;

alter table public.korana_hashtags
enable row level security;

alter table public.korana_post_hashtags
enable row level security;

alter table public.korana_mentions
enable row level security;

alter table public.korana_reports
enable row level security;

alter table public.korana_moderation_actions
enable row level security;

alter table public.korana_feed_preferences
enable row level security;


-- ------------------------------------------------------------
-- REMOVE DEFAULT APPLICATION DML
-- ------------------------------------------------------------

revoke all
on table
public.korana_actors,
public.korana_posts,
public.korana_post_media,
public.korana_follows,
public.korana_comments,
public.korana_reactions,
public.korana_reposts,
public.korana_saved_posts,
public.korana_hashtags,
public.korana_post_hashtags,
public.korana_mentions,
public.korana_reports,
public.korana_moderation_actions,
public.korana_feed_preferences
from anon, authenticated;


-- ------------------------------------------------------------
-- ACTORS
-- ------------------------------------------------------------

create policy
korana_actors_visible

on public.korana_actors

for select

to anon, authenticated

using (
    public.korana_can_view_actor(
        id
    )
);


grant select
on public.korana_actors
to anon, authenticated;


-- ------------------------------------------------------------
-- POSTS
-- ------------------------------------------------------------

create policy
korana_posts_visible

on public.korana_posts

for select

to anon, authenticated

using (
    public.korana_can_view_post(
        id
    )
);


grant select
on public.korana_posts
to anon, authenticated;


-- ------------------------------------------------------------
-- MEDIA METADATA
-- ------------------------------------------------------------

create policy
korana_post_media_visible

on public.korana_post_media

for select

to anon, authenticated

using (
    public.korana_can_view_post(
        post_id
    )
);


grant select
on public.korana_post_media
to anon, authenticated;


-- ------------------------------------------------------------
-- FOLLOW GRAPH
-- ------------------------------------------------------------

create policy
korana_follows_visible

on public.korana_follows

for select

to anon, authenticated

using (

    (
        public.korana_can_view_actor(
            follower_actor_id
        )

        and

        public.korana_can_view_actor(
            followed_actor_id
        )
    )

    or

    public.korana_owns_actor(
        follower_actor_id
    )

    or

    public.korana_owns_actor(
        followed_actor_id
    )

);


grant select
on public.korana_follows
to anon, authenticated;


-- ------------------------------------------------------------
-- COMMENTS
-- ------------------------------------------------------------

create policy
korana_comments_visible

on public.korana_comments

for select

to anon, authenticated

using (
    public.korana_can_view_comment(
        id
    )
);


grant select
on public.korana_comments
to anon, authenticated;


-- ------------------------------------------------------------
-- REACTIONS
-- ------------------------------------------------------------

create policy
korana_reactions_visible

on public.korana_reactions

for select

to anon, authenticated

using (

    (
        target_type =
        'post'

        and

        public.korana_can_view_post(
            post_id
        )
    )

    or

    (
        target_type =
        'comment'

        and

        public.korana_can_view_comment(
            comment_id
        )
    )

);


grant select
on public.korana_reactions
to anon, authenticated;


-- ------------------------------------------------------------
-- REPOSTS
-- ------------------------------------------------------------

create policy
korana_reposts_visible

on public.korana_reposts

for select

to anon, authenticated

using (

    (

        status =
        'published'

        and

        public.korana_can_view_actor(
            actor_id
        )

        and

        public.korana_can_view_post(
            post_id
        )

    )

    or

    public.korana_owns_actor(
        actor_id
    )

);


grant select
on public.korana_reposts
to anon, authenticated;


-- ------------------------------------------------------------
-- SAVED POSTS
-- ------------------------------------------------------------

create policy
korana_saved_posts_owner

on public.korana_saved_posts

for select

to authenticated

using (
    public.korana_owns_actor(
        actor_id
    )
);


grant select
on public.korana_saved_posts
to authenticated;


-- ------------------------------------------------------------
-- HASHTAGS
-- ------------------------------------------------------------

create policy
korana_hashtags_public

on public.korana_hashtags

for select

to anon, authenticated

using (
    true
);


grant select
on public.korana_hashtags
to anon, authenticated;


create policy
korana_post_hashtags_visible

on public.korana_post_hashtags

for select

to anon, authenticated

using (
    public.korana_can_view_post(
        post_id
    )
);


grant select
on public.korana_post_hashtags
to anon, authenticated;


-- ------------------------------------------------------------
-- MENTIONS
-- ------------------------------------------------------------

create policy
korana_mentions_visible

on public.korana_mentions

for select

to anon, authenticated

using (

    public.korana_owns_actor(
        mentioned_actor_id
    )

    or

    (
        target_type =
        'post'

        and

        public.korana_can_view_post(
            post_id
        )
    )

    or

    (
        target_type =
        'comment'

        and

        public.korana_can_view_comment(
            comment_id
        )
    )

);


grant select
on public.korana_mentions
to anon, authenticated;


-- ------------------------------------------------------------
-- REPORTS
-- ------------------------------------------------------------

create policy
korana_reports_reporter_read

on public.korana_reports

for select

to authenticated

using (
    public.korana_owns_actor(
        reporter_actor_id
    )
);


grant select
on public.korana_reports
to authenticated;


-- ------------------------------------------------------------
-- FEED PREFERENCES
-- ------------------------------------------------------------

create policy
korana_feed_preferences_owner

on public.korana_feed_preferences

for select

to authenticated

using (
    profile_id =
    auth.uid()
);


grant select
on public.korana_feed_preferences
to authenticated;


-- ============================================================
-- 25. PRIVATE STORAGE BUCKET
-- ============================================================

insert into
storage.buckets (
    id,
    name,
    public
)

values (
    'korana-media',
    'korana-media',
    false
)

on conflict (
    id
)

do update

set
    public =
        false;


drop policy if exists
korana_media_read
on storage.objects;


create policy
korana_media_read

on storage.objects

for select

to anon, authenticated

using (

    bucket_id =
    'korana-media'

    and

    (

        exists (

            select
                1

            from
                public.korana_actors a

            where
                a.id::text =
                (storage.foldername(name))[1]

              and
                public.korana_owns_actor(
                    a.id
                )

        )

        or

        exists (

            select
                1

            from
                public.korana_posts p

            where
                p.id::text =
                (storage.foldername(name))[2]

              and
                public.korana_can_view_post(
                    p.id
                )

        )

    )

);


drop policy if exists
korana_media_insert
on storage.objects;


create policy
korana_media_insert

on storage.objects

for insert

to authenticated

with check (

    bucket_id =
    'korana-media'

    and

    exists (

        select
            1

        from
            public.korana_posts p

        where
            p.author_actor_id::text =
            (storage.foldername(name))[1]

          and
            p.id::text =
            (storage.foldername(name))[2]

          and
            public.korana_can_manage_actor(
                p.author_actor_id
            )

          and
            p.status not in (
                'hidden',
                'deleted'
            )

    )

);


drop policy if exists
korana_media_update
on storage.objects;


create policy
korana_media_update

on storage.objects

for update

to authenticated

using (

    bucket_id =
    'korana-media'

    and

    exists (

        select
            1

        from
            public.korana_posts p

        where
            p.author_actor_id::text =
            (storage.foldername(name))[1]

          and
            p.id::text =
            (storage.foldername(name))[2]

          and
            public.korana_can_manage_actor(
                p.author_actor_id
            )

    )

)

with check (

    bucket_id =
    'korana-media'

    and

    exists (

        select
            1

        from
            public.korana_posts p

        where
            p.author_actor_id::text =
            (storage.foldername(name))[1]

          and
            p.id::text =
            (storage.foldername(name))[2]

          and
            public.korana_can_manage_actor(
                p.author_actor_id
            )

    )

);


drop policy if exists
korana_media_delete
on storage.objects;


create policy
korana_media_delete

on storage.objects

for delete

to authenticated

using (

    bucket_id =
    'korana-media'

    and

    exists (

        select
            1

        from
            public.korana_posts p

        where
            p.author_actor_id::text =
            (storage.foldername(name))[1]

          and
            p.id::text =
            (storage.foldername(name))[2]

          and
            public.korana_can_manage_actor(
                p.author_actor_id
            )

    )

);


-- ============================================================
-- 26. REALTIME FOUNDATION
-- ============================================================

alter table
public.korana_posts
replica identity full;

alter table
public.korana_comments
replica identity full;

alter table
public.korana_reactions
replica identity full;

alter table
public.korana_reposts
replica identity full;

alter table
public.korana_follows
replica identity full;


do $realtime$

begin

    begin

        alter publication
        supabase_realtime

        add table
            public.korana_posts,
            public.korana_comments,
            public.korana_reactions,
            public.korana_reposts,
            public.korana_follows;

    exception

        when duplicate_object then
            null;

        when undefined_object then
            null;

    end;

end;

$realtime$;


-- ============================================================
-- 27. FOUNDATION SNAPSHOT
--
-- Diagnostic/read contract for K1.
-- No social mutation is exposed here.
-- ============================================================

create or replace function
public.korana_foundation_snapshot()
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

    if
        auth.uid()
        is null
    then

        raise exception
            'AUTHENTICATION_REQUIRED'
            using errcode =
            '42501';

    end if;


    return
        jsonb_build_object(


            'ready',
                true,


            'actors',

                jsonb_build_object(

                    'total',
                        (
                            select
                                count(*)

                            from
                                public.korana_actors
                        ),

                    'profiles',
                        (
                            select
                                count(*)

                            from
                                public.korana_actors

                            where
                                actor_type =
                                'profile'
                        ),

                    'organizations',
                        (
                            select
                                count(*)

                            from
                                public.korana_actors

                            where
                                actor_type =
                                'organization'
                        )

                ),


            'content',

                jsonb_build_object(

                    'posts',
                        (
                            select count(*)
                            from public.korana_posts
                        ),

                    'comments',
                        (
                            select count(*)
                            from public.korana_comments
                        ),

                    'reactions',
                        (
                            select count(*)
                            from public.korana_reactions
                        ),

                    'reposts',
                        (
                            select count(*)
                            from public.korana_reposts
                        ),

                    'follows',
                        (
                            select count(*)
                            from public.korana_follows
                        )

                ),


            'myActors',

                coalesce(

                    (

                        select
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
                                        a.organization_id

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

                            )

                        from
                            public.korana_actors a

                        where
                            public.korana_owns_actor(
                                a.id
                            )

                    ),

                    '[]'::jsonb

                ),


            'storage',

                jsonb_build_object(

                    'bucket',
                        'korana-media',

                    'public',
                        false

                ),


            'directWrites',

                false

        );

end;

$function$;


revoke all
on function
public.korana_foundation_snapshot()
from public, anon;


grant execute
on function
public.korana_foundation_snapshot()
to authenticated;


commit;