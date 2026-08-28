begin;


-- ============================================================
-- INDESY KORANA
-- K3-C - PRIVATE MEDIA ATTACHMENT
-- ============================================================


create unique index if not exists
korana_post_media_storage_path_uidx
on public.korana_post_media (
    storage_path
);


create or replace function
public.korana_attach_post_media(

    p_post_id uuid,

    p_storage_path text,

    p_media_type text,

    p_mime_type text,

    p_file_size_bytes bigint,

    p_position integer default 0,

    p_width_px integer default null,

    p_height_px integer default null,

    p_duration_seconds numeric default null,

    p_alt_text text default null

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

    v_media_type text;

    v_expected_prefix text;

    v_existing_count integer;

    v_has_video boolean;

    v_media_id uuid;

begin

    if auth.uid() is null then

        raise exception
            'AUTHENTICATION_REQUIRED'
            using errcode = '42501';

    end if;


    select *
    into v_post
    from public.korana_posts
    where id = p_post_id
    for update;


    if not found then

        raise exception
            'KORANA_POST_NOT_FOUND';

    end if;


    if not public.korana_can_manage_actor(
        v_post.author_actor_id
    ) then

        raise exception
            'KORANA_POST_FORBIDDEN'
            using errcode = '42501';

    end if;


    if v_post.status not in (
        'draft',
        'published'
    ) then

        raise exception
            'KORANA_POST_MEDIA_NOT_ALLOWED';

    end if;


    v_media_type :=
        lower(
            btrim(
                coalesce(
                    p_media_type,
                    ''
                )
            )
        );


    if v_media_type not in (
        'image',
        'video'
    ) then

        raise exception
            'KORANA_MEDIA_TYPE_INVALID';

    end if;


    if p_storage_path is null
       or btrim(p_storage_path) = ''
       or char_length(p_storage_path) > 1024
       or p_storage_path like '%..%'
    then

        raise exception
            'KORANA_MEDIA_PATH_INVALID';

    end if;


    v_expected_prefix :=
        v_post.author_actor_id::text
        || '/'
        || v_post.id::text
        || '/';


    if left(
        p_storage_path,
        char_length(v_expected_prefix)
    ) <> v_expected_prefix
    then

        raise exception
            'KORANA_MEDIA_PATH_FORBIDDEN'
            using errcode = '42501';

    end if;


    if p_file_size_bytes is null
       or p_file_size_bytes <= 0
    then

        raise exception
            'KORANA_MEDIA_SIZE_INVALID';

    end if;


    if v_media_type = 'image' then

        if p_mime_type not in (
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif'
        ) then

            raise exception
                'KORANA_IMAGE_FORMAT_INVALID';

        end if;


        if p_file_size_bytes > 10485760 then

            raise exception
                'KORANA_IMAGE_TOO_LARGE';

        end if;

    else

        if p_mime_type not in (
            'video/mp4',
            'video/webm'
        ) then

            raise exception
                'KORANA_VIDEO_FORMAT_INVALID';

        end if;


        if p_file_size_bytes > 104857600 then

            raise exception
                'KORANA_VIDEO_TOO_LARGE';

        end if;

    end if;


    select
        count(*)::integer,
        coalesce(
            bool_or(
                media_type = 'video'
            ),
            false
        )
    into
        v_existing_count,
        v_has_video
    from public.korana_post_media
    where post_id = p_post_id;


    if v_media_type = 'video' then

        if v_existing_count > 0 then

            raise exception
                'KORANA_VIDEO_MUST_BE_ALONE';

        end if;


        if coalesce(
            p_position,
            0
        ) <> 0
        then

            raise exception
                'KORANA_VIDEO_POSITION_INVALID';

        end if;

    else

        if v_has_video then

            raise exception
                'KORANA_IMAGE_VIDEO_MIX_NOT_ALLOWED';

        end if;


        if v_existing_count >= 4 then

            raise exception
                'KORANA_IMAGE_LIMIT_REACHED';

        end if;


        if coalesce(
            p_position,
            0
        ) not between 0 and 3
        then

            raise exception
                'KORANA_IMAGE_POSITION_INVALID';

        end if;

    end if;


    insert into public.korana_post_media (
        post_id,
        storage_path,
        media_type,
        mime_type,
        file_size_bytes,
        width_px,
        height_px,
        duration_seconds,
        alt_text,
        position
    )
    values (
        p_post_id,
        p_storage_path,
        v_media_type,
        p_mime_type,
        p_file_size_bytes,
        p_width_px,
        p_height_px,
        p_duration_seconds,
        nullif(
            btrim(
                coalesce(
                    p_alt_text,
                    ''
                )
            ),
            ''
        ),
        coalesce(
            p_position,
            0
        )
    )
    returning id
    into v_media_id;


    return (
        select jsonb_build_object(
            'id',
                m.id,

            'postId',
                m.post_id,

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
                m.position,

            'createdAt',
                m.created_at
        )
        from public.korana_post_media m
        where m.id = v_media_id
    );

end;

$function$;


revoke all
on function public.korana_attach_post_media(
    uuid,
    text,
    text,
    text,
    bigint,
    integer,
    integer,
    integer,
    numeric,
    text
)
from public, anon;


grant execute
on function public.korana_attach_post_media(
    uuid,
    text,
    text,
    text,
    bigint,
    integer,
    integer,
    integer,
    numeric,
    text
)
to authenticated;


comment on function public.korana_attach_post_media(
    uuid,
    text,
    text,
    text,
    bigint,
    integer,
    integer,
    integer,
    numeric,
    text
)
is
'Indesy Korana K3-C: securely attach a private Storage object to an owned Korana post.';


commit;