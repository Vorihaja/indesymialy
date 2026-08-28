begin;


-- ============================================================
-- INDESY MIALY
-- I0-B - UNIVERSAL PROFILE AVATAR STORAGE
--
-- Canonical identity value:
-- public.profiles.photo_url
--
-- Storage:
-- profile-avatars/{auth.uid()}/{uuid}.{extension}
-- ============================================================


insert into
storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)

values (
    'profile-avatars',
    'profile-avatars',
    true,
    5242880,
    array[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
)

on conflict (
    id
)

do update

set
    name =
        excluded.name,

    public =
        true,

    file_size_limit =
        excluded.file_size_limit,

    allowed_mime_types =
        excluded.allowed_mime_types;


-- ============================================================
-- OWNER READ
--
-- Public rendering uses the public bucket endpoint.
-- Storage API metadata remains restricted to the owner.
-- ============================================================

drop policy if exists
profile_avatars_owner_read
on storage.objects;


create policy
profile_avatars_owner_read

on storage.objects

for select

to authenticated

using (

    bucket_id =
        'profile-avatars'

    and

    (storage.foldername(name))[1] =
        auth.uid()::text

);


-- ============================================================
-- OWNER INSERT
-- ============================================================

drop policy if exists
profile_avatars_owner_insert
on storage.objects;


create policy
profile_avatars_owner_insert

on storage.objects

for insert

to authenticated

with check (

    bucket_id =
        'profile-avatars'

    and

    (storage.foldername(name))[1] =
        auth.uid()::text

    and

    coalesce(
        array_length(
            storage.foldername(name),
            1
        ),
        0
    ) = 1

    and

    lower(
        storage.extension(name)
    ) in (
        'jpg',
        'jpeg',
        'png',
        'webp'
    )

);


-- ============================================================
-- OWNER UPDATE
-- ============================================================

drop policy if exists
profile_avatars_owner_update
on storage.objects;


create policy
profile_avatars_owner_update

on storage.objects

for update

to authenticated

using (

    bucket_id =
        'profile-avatars'

    and

    (storage.foldername(name))[1] =
        auth.uid()::text

)

with check (

    bucket_id =
        'profile-avatars'

    and

    (storage.foldername(name))[1] =
        auth.uid()::text

    and

    coalesce(
        array_length(
            storage.foldername(name),
            1
        ),
        0
    ) = 1

    and

    lower(
        storage.extension(name)
    ) in (
        'jpg',
        'jpeg',
        'png',
        'webp'
    )

);


-- ============================================================
-- OWNER DELETE
-- ============================================================

drop policy if exists
profile_avatars_owner_delete
on storage.objects;


create policy
profile_avatars_owner_delete

on storage.objects

for delete

to authenticated

using (

    bucket_id =
        'profile-avatars'

    and

    (storage.foldername(name))[1] =
        auth.uid()::text

);


commit;