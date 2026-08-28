begin;


-- ============================================================
-- INDESY KORANA
-- K3-D.1 - DETACH EXISTING POST MEDIA
--
-- The database relation is removed first.
-- The client then removes the private Storage object.
--
-- This avoids leaving a post referencing an unavailable file.
-- ============================================================


create or replace function
public.korana_detach_post_media(
    p_media_id uuid
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

    v_media
        public.korana_post_media%rowtype;

    v_post
        public.korana_posts%rowtype;

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
    -- MEDIA
    -- ========================================================

    select
        *

    into
        v_media

    from
        public.korana_post_media

    where
        id =
        p_media_id

    for update;


    if not found then

        raise exception
            'KORANA_MEDIA_NOT_FOUND';

    end if;


    -- ========================================================
    -- POST
    -- ========================================================

    select
        *

    into
        v_post

    from
        public.korana_posts

    where
        id =
        v_media.post_id

    for update;


    if not found then

        raise exception
            'KORANA_POST_NOT_FOUND';

    end if;


    -- ========================================================
    -- ACTOR AUTHORIZATION
    -- ========================================================

    if not
        public.korana_can_manage_actor(
            v_post.author_actor_id
        )
    then

        raise exception
            'KORANA_MEDIA_FORBIDDEN'
            using errcode =
            '42501';

    end if;


    -- ========================================================
    -- MODERATION / STATUS
    -- ========================================================

    if
        v_post.status not in (
            'draft',
            'published'
        )
    then

        raise exception
            'KORANA_MEDIA_NOT_EDITABLE';

    end if;


    -- ========================================================
    -- DETACH
    -- ========================================================

    delete from
        public.korana_post_media

    where
        id =
        v_media.id;


    return
        jsonb_build_object(

            'id',
                v_media.id,

            'postId',
                v_media.post_id,

            'storagePath',
                v_media.storage_path

        );

end;

$function$;


revoke all
on function
public.korana_detach_post_media(
    uuid
)
from public, anon;


grant execute
on function
public.korana_detach_post_media(
    uuid
)
to authenticated;


comment on function
public.korana_detach_post_media(
    uuid
)
is
'Indesy Korana K3-D.1: securely detach an existing media item from an owned editable Korana post.';


commit;