begin;


-- ============================================================
-- INDESY KORANA
-- K4-C - COMMENTS / REPLIES
--
-- Scope:
-- - secure comments read model
-- - create / update / soft delete
-- - recursive replies
-- - post reply_control enforcement
-- - @mention synchronization
-- - deleted-parent placeholders
-- - real data only
-- ============================================================


-- ============================================================
-- 1. POST MENTION SYNCHRONIZATION
-- ============================================================

create or replace function
public._korana_sync_post_mentions_trigger()
returns trigger

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

begin

    delete from
        public.korana_mentions

    where
        target_type =
        'post'

      and
        post_id =
        new.id;


    if
        new.status in (
            'deleted',
            'hidden'
        )
    then

        return
            new;

    end if;


    insert into
    public.korana_mentions (

        mentioned_actor_id,

        target_type,

        post_id,

        comment_id

    )

    select distinct

        a.id,

        'post',

        new.id,

        null::uuid

    from
        regexp_matches(

            lower(
                coalesce(
                    new.content,
                    ''
                )
            ),

            '@([a-z0-9][a-z0-9._-]{2,49})',

            'g'

        )
        as rm(handle_parts)

    join
        public.korana_actors a
        on a.handle =
           rm.handle_parts[1]

    where
        a.status =
        'active'

    on conflict
    do nothing;


    return
        new;

end;

$function$;


revoke all
on function
public._korana_sync_post_mentions_trigger()
from public, anon, authenticated;


drop trigger if exists
korana_posts_sync_mentions
on public.korana_posts;


create trigger
korana_posts_sync_mentions

after insert or update of
    content,
    status

on public.korana_posts

for each row

execute function
public._korana_sync_post_mentions_trigger();


-- ============================================================
-- 2. COMMENT MENTION SYNCHRONIZATION
-- ============================================================

create or replace function
public._korana_sync_comment_mentions_trigger()
returns trigger

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

begin

    delete from
        public.korana_mentions

    where
        target_type =
        'comment'

      and
        comment_id =
        new.id;


    if
        new.status in (
            'deleted',
            'hidden'
        )
    then

        return
            new;

    end if;


    insert into
    public.korana_mentions (

        mentioned_actor_id,

        target_type,

        post_id,

        comment_id

    )

    select distinct

        a.id,

        'comment',

        null::uuid,

        new.id

    from
        regexp_matches(

            lower(
                coalesce(
                    new.content,
                    ''
                )
            ),

            '@([a-z0-9][a-z0-9._-]{2,49})',

            'g'

        )
        as rm(handle_parts)

    join
        public.korana_actors a
        on a.handle =
           rm.handle_parts[1]

    where
        a.status =
        'active'

    on conflict
    do nothing;


    return
        new;

end;

$function$;


revoke all
on function
public._korana_sync_comment_mentions_trigger()
from public, anon, authenticated;


drop trigger if exists
korana_comments_sync_mentions
on public.korana_comments;


create trigger
korana_comments_sync_mentions

after insert or update of
    content,
    status

on public.korana_comments

for each row

execute function
public._korana_sync_comment_mentions_trigger();


-- ============================================================
-- 3. BACKFILL EXISTING POST MENTIONS
-- ============================================================

insert into
public.korana_mentions (

    mentioned_actor_id,

    target_type,

    post_id,

    comment_id

)

select distinct

    a.id,

    'post',

    p.id,

    null::uuid

from
    public.korana_posts p

cross join lateral

    regexp_matches(

        lower(
            coalesce(
                p.content,
                ''
            )
        ),

        '@([a-z0-9][a-z0-9._-]{2,49})',

        'g'

    )
    as rm(handle_parts)

join
    public.korana_actors a
    on a.handle =
       rm.handle_parts[1]

where
    p.status =
    'published'

  and
    a.status =
    'active'

on conflict
do nothing;


-- ============================================================
-- 4. BACKFILL EXISTING COMMENT MENTIONS
-- ============================================================

insert into
public.korana_mentions (

    mentioned_actor_id,

    target_type,

    post_id,

    comment_id

)

select distinct

    a.id,

    'comment',

    null::uuid,

    c.id

from
    public.korana_comments c

cross join lateral

    regexp_matches(

        lower(
            coalesce(
                c.content,
                ''
            )
        ),

        '@([a-z0-9][a-z0-9._-]{2,49})',

        'g'

    )
    as rm(handle_parts)

join
    public.korana_actors a
    on a.handle =
       rm.handle_parts[1]

where
    c.status =
    'published'

  and
    a.status =
    'active'

on conflict
do nothing;


-- ============================================================
-- 5. COMMENT PERMISSION ENGINE
--
-- Returns:
-- allowed
-- authentication_required
-- actor_required
-- actor_forbidden
-- post_not_found
-- post_closed
-- post_forbidden
-- followers_only
-- mentioned_only
-- ============================================================

create or replace function
public._korana_comment_permission(

    p_post_id uuid,

    p_actor_id uuid

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

    v_post
        public.korana_posts%rowtype;

begin

    if
        auth.uid()
        is null
    then

        return
            'authentication_required';

    end if;


    if
        p_actor_id
        is null
    then

        return
            'actor_required';

    end if;


    if not
        public.korana_can_manage_actor(
            p_actor_id
        )
    then

        return
            'actor_forbidden';

    end if;


    select
        *

    into
        v_post

    from
        public.korana_posts

    where
        id =
        p_post_id;


    if not found then

        return
            'post_not_found';

    end if;


    if
        v_post.status <>
        'published'

        or

        v_post.published_at
        is null

        or

        v_post.published_at >
        now()
    then

        return
            'post_closed';

    end if;


    if not
        public.korana_can_view_post(
            p_post_id
        )
    then

        return
            'post_forbidden';

    end if;


    -- The author can always participate in their own thread.

    if
        p_actor_id =
        v_post.author_actor_id
    then

        return
            'allowed';

    end if;


    if
        v_post.reply_control =
        'everyone'
    then

        return
            'allowed';

    end if;


    if
        v_post.reply_control =
        'followers'
    then

        if exists (

            select
                1

            from
                public.korana_follows f

            where
                f.follower_actor_id =
                p_actor_id

              and
                f.followed_actor_id =
                v_post.author_actor_id

        )
        then

            return
                'allowed';

        end if;


        return
            'followers_only';

    end if;


    if
        v_post.reply_control =
        'mentioned'
    then

        if exists (

            select
                1

            from
                public.korana_mentions m

            where
                m.target_type =
                'post'

              and
                m.post_id =
                p_post_id

              and
                m.mentioned_actor_id =
                p_actor_id

        )
        then

            return
                'allowed';

        end if;


        return
            'mentioned_only';

    end if;


    return
        'post_forbidden';

end;

$function$;


revoke all
on function
public._korana_comment_permission(
    uuid,
    uuid
)
from public, anon, authenticated;


-- ============================================================
-- 6. COMMENT MUTATION JSON
-- ============================================================

create or replace function
public._korana_comment_mutation_json(
    p_comment_id uuid
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
                c.id,

            'postId',
                c.post_id,

            'authorActorId',
                c.author_actor_id,

            'parentCommentId',
                c.parent_comment_id,

            'content',
                c.content,

            'status',
                c.status,

            'editedAt',
                c.edited_at,

            'deletedAt',
                c.deleted_at,

            'createdAt',
                c.created_at,

            'updatedAt',
                c.updated_at

        )

    from
        public.korana_comments c

    where
        c.id =
        p_comment_id;

$function$;


revoke all
on function
public._korana_comment_mutation_json(
    uuid
)
from public, anon, authenticated;


-- ============================================================
-- 7. COMMENTS SNAPSHOT
--
-- Deleted / hidden ancestors are returned only as placeholders
-- when necessary to preserve a visible reply tree.
-- ============================================================

create or replace function
public.korana_comments_snapshot(

    p_post_id uuid,

    p_actor_id uuid
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

    v_permission text;

    v_comments jsonb;

begin

    select
        *

    into
        v_post

    from
        public.korana_posts

    where
        id =
        p_post_id;


    if not found then

        raise exception
            'KORANA_COMMENT_POST_NOT_FOUND';

    end if;


    if not
        public.korana_can_view_post(
            p_post_id
        )
    then

        raise exception
            'KORANA_COMMENT_POST_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    if
        p_actor_id
        is not null
    then

        if
            auth.uid()
            is null
        then

            raise exception
                'AUTHENTICATION_REQUIRED'
                using errcode =
                '42501';

        end if;


        if not
            public.korana_owns_actor(
                p_actor_id
            )
        then

            raise exception
                'KORANA_COMMENT_ACTOR_FORBIDDEN'
                using errcode =
                '42501';

        end if;

    end if;


    v_permission :=
        public._korana_comment_permission(
            p_post_id,
            p_actor_id
        );


    with recursive
    relevant_comments (
        id,
        parent_comment_id
    )
    as (

        select

            c.id,

            c.parent_comment_id

        from
            public.korana_comments c

        where
            c.post_id =
            p_post_id

          and
            c.status =
            'published'


        union


        select

            parent.id,

            parent.parent_comment_id

        from
            public.korana_comments parent

        join
            relevant_comments child
            on child.parent_comment_id =
               parent.id

        where
            parent.post_id =
            p_post_id

    ),

    distinct_comments as (

        select distinct
            id

        from
            relevant_comments

    )

    select

        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'id',
                        c.id,

                    'postId',
                        c.post_id,

                    'parentCommentId',
                        c.parent_comment_id,

                    'content',

                        case
                            when
                                c.status =
                                'published'
                            then
                                c.content

                            else
                                null
                        end,

                    'status',
                        c.status,

                    'editedAt',

                        case
                            when
                                c.status =
                                'published'
                            then
                                c.edited_at

                            else
                                null
                        end,

                    'createdAt',
                        c.created_at,

                    'updatedAt',
                        c.updated_at,

                    'author',

                        case

                            when
                                c.status =
                                'published'
                            then

                                jsonb_build_object(

                                    'id',
                                        a.id,

                                    'handle',
                                        a.handle,

                                    'displayName',
                                        a.display_name,

                                    'avatarUrl',
                                        a.avatar_url,

                                    'verified',
                                        a.is_verified

                                )

                            else
                                null

                        end,

                    'counts',

                        jsonb_build_object(

                            'replies',

                                case

                                    when
                                        c.status =
                                        'published'
                                    then

                                        (
                                            select
                                                count(*)

                                            from
                                                public.korana_comments reply

                                            where
                                                reply.parent_comment_id =
                                                c.id

                                              and
                                                reply.status =
                                                'published'
                                        )

                                    else
                                        0

                                end,

                            'reactions',

                                case

                                    when
                                        c.status =
                                        'published'
                                    then

                                        (
                                            select
                                                count(*)

                                            from
                                                public.korana_reactions reaction

                                            where
                                                reaction.target_type =
                                                'comment'

                                              and
                                                reaction.comment_id =
                                                c.id
                                        )

                                    else
                                        0

                                end

                        ),

                    'viewer',

                        jsonb_build_object(

                            'canManage',

                                (
                                    c.status =
                                    'published'

                                    and

                                    auth.uid()
                                    is not null

                                    and

                                    public.korana_can_manage_actor(
                                        c.author_actor_id
                                    )
                                ),

                            'reactionType',

                                (
                                    select
                                        reaction.reaction_type

                                    from
                                        public.korana_reactions reaction

                                    where
                                        c.status =
                                        'published'

                                      and
                                        p_actor_id
                                        is not null

                                      and
                                        reaction.actor_id =
                                        p_actor_id

                                      and
                                        reaction.target_type =
                                        'comment'

                                      and
                                        reaction.comment_id =
                                        c.id

                                    limit 1
                                )

                        )

                )

                order by
                    c.created_at,
                    c.id

            ),

            '[]'::jsonb

        )

    into
        v_comments

    from
        public.korana_comments c

    join
        distinct_comments relevant
        on relevant.id =
           c.id

    left join
        public.korana_actors a
        on a.id =
           c.author_actor_id;


    return
        jsonb_build_object(

            'postId',
                p_post_id,

            'replyControl',
                v_post.reply_control,

            'canComment',
                (
                    v_permission =
                    'allowed'
                ),

            'canCommentReason',

                case
                    when
                        v_permission =
                        'allowed'
                    then
                        null

                    else
                        v_permission
                end,

            'comments',
                v_comments

        );

end;

$function$;


revoke all
on function
public.korana_comments_snapshot(
    uuid,
    uuid
)
from public;


grant execute
on function
public.korana_comments_snapshot(
    uuid,
    uuid
)
to anon, authenticated;


-- ============================================================
-- 8. CREATE COMMENT / REPLY
-- ============================================================

create or replace function
public.korana_create_comment(

    p_actor_id uuid,

    p_post_id uuid,

    p_content text,

    p_parent_comment_id uuid
        default null

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

    v_permission text;

    v_parent
        public.korana_comments%rowtype;

    v_comment_id uuid;

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


    v_permission :=
        public._korana_comment_permission(
            p_post_id,
            p_actor_id
        );


    if
        v_permission <>
        'allowed'
    then

        raise exception
            'KORANA_COMMENT_NOT_ALLOWED: %',
            v_permission
            using errcode =
            '42501';

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
        )
        not between
        1 and 5000
    then

        raise exception
            'KORANA_COMMENT_CONTENT_INVALID';

    end if;


    if
        p_parent_comment_id
        is not null
    then

        select
            *

        into
            v_parent

        from
            public.korana_comments

        where
            id =
            p_parent_comment_id

          and
            post_id =
            p_post_id

          and
            status =
            'published';


        if not found then

            raise exception
                'KORANA_COMMENT_PARENT_NOT_FOUND';

        end if;


        if not
            public.korana_can_view_comment(
                p_parent_comment_id
            )
        then

            raise exception
                'KORANA_COMMENT_PARENT_FORBIDDEN'
                using errcode =
                '42501';

        end if;

    end if;


    insert into
    public.korana_comments (

        post_id,

        author_actor_id,

        parent_comment_id,

        content,

        status

    )

    values (

        p_post_id,

        p_actor_id,

        p_parent_comment_id,

        v_content,

        'published'

    )

    returning
        id

    into
        v_comment_id;


    return
        public._korana_comment_mutation_json(
            v_comment_id
        );

end;

$function$;


revoke all
on function
public.korana_create_comment(
    uuid,
    uuid,
    text,
    uuid
)
from public, anon;


grant execute
on function
public.korana_create_comment(
    uuid,
    uuid,
    text,
    uuid
)
to authenticated;


-- ============================================================
-- 9. UPDATE COMMENT
-- ============================================================

create or replace function
public.korana_update_comment(

    p_comment_id uuid,

    p_content text

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

    v_comment
        public.korana_comments%rowtype;

    v_content text;

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
        v_comment

    from
        public.korana_comments

    where
        id =
        p_comment_id

    for update;


    if not found then

        raise exception
            'KORANA_COMMENT_NOT_FOUND';

    end if;


    if
        v_comment.status <>
        'published'
    then

        raise exception
            'KORANA_COMMENT_NOT_EDITABLE';

    end if;


    if not
        public.korana_can_manage_actor(
            v_comment.author_actor_id
        )
    then

        raise exception
            'KORANA_COMMENT_FORBIDDEN'
            using errcode =
            '42501';

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
        )
        not between
        1 and 5000
    then

        raise exception
            'KORANA_COMMENT_CONTENT_INVALID';

    end if;


    update
        public.korana_comments

    set
        content =
            v_content,

        edited_at =
            now()

    where
        id =
        p_comment_id;


    return
        public._korana_comment_mutation_json(
            p_comment_id
        );

end;

$function$;


revoke all
on function
public.korana_update_comment(
    uuid,
    text
)
from public, anon;


grant execute
on function
public.korana_update_comment(
    uuid,
    text
)
to authenticated;


-- ============================================================
-- 10. SOFT DELETE COMMENT
--
-- Replies are intentionally preserved.
-- Snapshot will render a deleted-parent placeholder.
-- ============================================================

create or replace function
public.korana_delete_comment(
    p_comment_id uuid
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

    v_comment
        public.korana_comments%rowtype;

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
        v_comment

    from
        public.korana_comments

    where
        id =
        p_comment_id

    for update;


    if not found then

        raise exception
            'KORANA_COMMENT_NOT_FOUND';

    end if;


    if not
        public.korana_can_manage_actor(
            v_comment.author_actor_id
        )
    then

        raise exception
            'KORANA_COMMENT_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    if
        v_comment.status =
        'deleted'
    then

        return
            public._korana_comment_mutation_json(
                p_comment_id
            );

    end if;


    if
        v_comment.status =
        'hidden'
    then

        raise exception
            'KORANA_COMMENT_NOT_EDITABLE';

    end if;


    update
        public.korana_comments

    set
        status =
            'deleted',

        deleted_at =
            now()

    where
        id =
        p_comment_id;


    return
        public._korana_comment_mutation_json(
            p_comment_id
        );

end;

$function$;


revoke all
on function
public.korana_delete_comment(
    uuid
)
from public, anon;


grant execute
on function
public.korana_delete_comment(
    uuid
)
to authenticated;


comment on function
public.korana_comments_snapshot(
    uuid,
    uuid
)
is
'Indesy Korana K4-C read model for visible comments and recursive replies.';


comment on function
public.korana_create_comment(
    uuid,
    uuid,
    text,
    uuid
)
is
'Indesy Korana K4-C secure comment and reply creation.';


comment on function
public.korana_update_comment(
    uuid,
    text
)
is
'Indesy Korana K4-C secure comment editing.';


comment on function
public.korana_delete_comment(
    uuid
)
is
'Indesy Korana K4-C secure soft deletion preserving reply threads.';


commit;