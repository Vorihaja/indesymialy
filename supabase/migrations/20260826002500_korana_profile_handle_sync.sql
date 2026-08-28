begin;


-- ============================================================
-- INDESY MIALY
-- I0-D
-- UNIVERSAL PROFILE -> KORANA HANDLE SYNCHRONIZATION
--
-- Canonical source:
--
-- public.profiles.username
--
-- Social projection:
--
-- public.korana_actors.handle
--
-- Principles:
--
-- - profiles remains the source of truth
-- - Korana Actor remains a projection
-- - Actor UUID never changes
-- - posts/follows/reactions/reposts remain attached to Actor UUID
-- - handle uniqueness is preserved by _korana_allocate_handle()
-- ============================================================


-- ============================================================
-- 1. PROFILE ACTOR SYNCHRONIZATION
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

    v_profile
        public.profiles%rowtype;

    v_actor_id
        uuid;

    v_handle
        text;

begin

    -- ========================================================
    -- PROFILE
    -- ========================================================

    select
        *

    into
        v_profile

    from
        public.profiles

    where
        id =
        p_profile_id;


    if not found
    then

        return
            null;

    end if;


    -- ========================================================
    -- EXISTING ACTOR
    -- ========================================================

    select
        id

    into
        v_actor_id

    from
        public.korana_actors

    where
        profile_id =
        p_profile_id;


    -- ========================================================
    -- HANDLE BASE
    --
    -- profiles.username is the canonical social handle source.
    -- ========================================================

    v_handle :=
        public._korana_handle_base(
            v_profile.username,
            'user',
            v_profile.id
        );


    -- ========================================================
    -- NEW ACTOR
    -- ========================================================

    if
        v_actor_id
        is null
    then

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

                    then
                        'active'

                else
                    'disabled'

            end

        )

        returning
            id

        into
            v_actor_id;


    -- ========================================================
    -- EXISTING ACTOR
    -- ========================================================

    else

        /*
         * Excluding the current Actor from uniqueness checks
         * means an unchanged username keeps the same handle.
         *
         * If another Actor owns the requested handle,
         * _korana_allocate_handle() adds the deterministic
         * profile UUID suffix.
         */

        v_handle :=
            public._korana_allocate_handle(
                v_handle,
                v_profile.id,
                v_actor_id
            );


        update
            public.korana_actors

        set

            handle =
                v_handle,

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

                                    then
                                        'suspended'

                                else
                                    'active'

                            end

                    else
                        'disabled'

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


-- ============================================================
-- 2. PROFILE TRIGGER
--
-- username is NOW part of the synchronization contract.
-- ============================================================

drop trigger if exists
korana_profiles_actor_sync
on public.profiles;


create trigger
korana_profiles_actor_sync

after insert or update of

    username,
    full_name,
    photo_url,
    is_verified,
    deactivated_at

on public.profiles

for each row

execute function
public._korana_profile_actor_trigger();


-- ============================================================
-- 3. BACKFILL
--
-- Reconcile every existing profile Actor with its canonical
-- Indesy profile.
--
-- This is intentionally executed before K5 profile URLs exist.
-- Actor UUIDs remain unchanged.
-- ============================================================

do $backfill$

declare

    v_profile
        record;

begin

    for
        v_profile

    in

        select
            p.id

        from
            public.profiles p

        order by
            p.created_at,
            p.id

    loop

        perform
            public._korana_sync_profile_actor(
                v_profile.id
            );

    end loop;

end;

$backfill$;


commit;