-- ============================================================
-- INDESY MIALY
-- KORANA K5-C1
--
-- PUBLIC IDENTIFIER GUARDS
--
-- Canonical human identity:
--
--     public.profiles.username
--
-- Social projection:
--
--     public.korana_actors.handle
--
-- Public URL target:
--
--     /<username>
--
-- Principles:
--
-- - no @ prefix
-- - lowercase canonical username
-- - 3..50 characters
-- - characters: a-z 0-9 . _ -
-- - username uniqueness is case-insensitive
-- - application root routes are reserved
-- - a profile username cannot steal another Korana Actor handle
-- - profile actor handle must remain exactly equal to username
-- - organization actors may receive a deterministic suffix
--   when their generated base collides with a reserved route
-- ============================================================


begin;


-- ============================================================
-- 1. RESERVED PUBLIC IDENTIFIERS
--
-- Keep this function synchronized whenever a new root-level
-- application route is introduced.
--
-- This list contains:
-- - current app root routes
-- - technical HTTP / Next.js identifiers
-- ============================================================

create or replace function
public._indesy_public_identifier_reserved(
    p_identifier text
)
returns boolean

language sql
immutable

set search_path =
    pg_catalog,
    public

as $function$

    select
        lower(
            btrim(
                coalesce(
                    p_identifier,
                    ''
                )
            )
        )
        =
        any (
            array[
                '_next',
                'account',
                'actualites',
                'admin',
                'annuaire',
                'api',
                'auth',
                'changelog',
                'club',
                'clubs',
                'contact',
                'dashboard',
                'disciplines',
                'discussion',
                'events',
                'faq',
                'favicon.ico',
                'feedback',
                'fighters',
                'help',
                'korana',
                'legal',
                'live',
                'maintenance',
                'manifest.webmanifest',
                'marketplace',
                'media',
                'messages',
                'notifications',
                'onboarding',
                'rankings',
                'regions',
                'report-bug',
                'robots.txt',
                'role-requests',
                'search',
                'sitemap.xml',
                'social',
                'status',
                'support',
                'sw.js',
                'vh-teck',
                'www'
            ]::text[]
        );

$function$;


revoke all
on function
public._indesy_public_identifier_reserved(
    text
)
from public, anon, authenticated;


comment on function
public._indesy_public_identifier_reserved(
    text
)
is
'Internal Indesy Mialy guard for root-level public identifiers reserved by the platform.';


-- ============================================================
-- 2. SERVER-SIDE PRECONDITIONS
--
-- K5-C0 already checked this remotely.
--
-- We check again inside the migration because data may have
-- changed between the audit and the real database push.
-- ============================================================

do $block$

begin

    -- --------------------------------------------------------
    -- Canonical profile usernames
    -- --------------------------------------------------------

    if exists (

        select
            1

        from
            public.profiles p

        where
            p.username is null

            or
            p.username <>
                lower(
                    btrim(
                        p.username
                    )
                )

            or
            p.username !~
                '^[a-z0-9][a-z0-9._-]{2,49}$'

    )
    then

        raise exception
            'K5C_PRECONDITION_INVALID_PROFILE_USERNAME';

    end if;


    -- --------------------------------------------------------
    -- Duplicate profile identifiers, case insensitive
    -- --------------------------------------------------------

    if exists (

        select
            lower(
                p.username
            )

        from
            public.profiles p

        group by
            lower(
                p.username
            )

        having
            count(*) > 1

    )
    then

        raise exception
            'K5C_PRECONDITION_DUPLICATE_PROFILE_USERNAME';

    end if;


    -- --------------------------------------------------------
    -- Reserved profile usernames
    -- --------------------------------------------------------

    if exists (

        select
            1

        from
            public.profiles p

        where
            public._indesy_public_identifier_reserved(
                p.username
            )

    )
    then

        raise exception
            'K5C_PRECONDITION_RESERVED_PROFILE_USERNAME';

    end if;


    -- --------------------------------------------------------
    -- Reserved existing Korana Actor handles
    -- --------------------------------------------------------

    if exists (

        select
            1

        from
            public.korana_actors a

        where
            public._indesy_public_identifier_reserved(
                a.handle
            )

    )
    then

        raise exception
            'K5C_PRECONDITION_RESERVED_ACTOR_HANDLE';

    end if;


    -- --------------------------------------------------------
    -- Every current profile must already have a matching Actor.
    --
    -- K5-C0 returned ACTOR_MISMATCH_COUNT=0.
    -- --------------------------------------------------------

    if exists (

        select
            1

        from
            public.profiles p

        left join
            public.korana_actors a

            on
                a.profile_id =
                    p.id

                and
                a.actor_type =
                    'profile'

        where
            a.id is null

            or
            a.handle <>
                p.username

    )
    then

        raise exception
            'K5C_PRECONDITION_PROFILE_ACTOR_MISMATCH';

    end if;


    -- --------------------------------------------------------
    -- A profile username may not belong to another Actor.
    -- --------------------------------------------------------

    if exists (

        select
            1

        from
            public.profiles p

        join
            public.korana_actors a

            on
                a.handle =
                    p.username

        where
            not (
                a.actor_type =
                    'profile'

                and
                a.profile_id =
                    p.id
            )

    )
    then

        raise exception
            'K5C_PRECONDITION_CROSS_ACTOR_COLLISION';

    end if;

end;

$block$;


-- ============================================================
-- 3. PROFILE USERNAME DATABASE CONSTRAINTS
-- ============================================================

alter table
public.profiles

drop constraint if exists
profiles_username_public_canonical_check;


alter table
public.profiles

add constraint
profiles_username_public_canonical_check

check (

    username =
        lower(
            btrim(
                username
            )
        )

);


alter table
public.profiles

drop constraint if exists
profiles_username_public_format_check;


alter table
public.profiles

add constraint
profiles_username_public_format_check

check (

    username ~
        '^[a-z0-9][a-z0-9._-]{2,49}$'

);


-- ============================================================
-- Case-insensitive database uniqueness.
--
-- Since canonical usernames are lowercase, this also serves as
-- a defensive guarantee against legacy / bypass writes.
-- ============================================================

create unique index if not exists
profiles_username_lower_uidx

on public.profiles (

    lower(
        username
    )

);


-- ============================================================
-- 4. PROFILE USERNAME WRITE GUARD
--
-- This trigger provides explicit application-friendly errors.
--
-- It also checks global Korana Actor handle occupancy because
-- profiles and organizations share the same public handle
-- namespace.
-- ============================================================

create or replace function
public._indesy_validate_profile_public_identifier()
returns trigger

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_username text;

begin

    if
        new.username is null
    then

        raise exception
            'USERNAME_REQUIRED'
            using errcode =
            '22023';

    end if;


    v_username :=
        lower(
            btrim(
                new.username
            )
        );


    if
        v_username =
        ''
    then

        raise exception
            'USERNAME_REQUIRED'
            using errcode =
            '22023';

    end if;


    /*
     * No silent rewriting.
     *
     * Application code must submit the canonical username.
     */

    if
        new.username <>
        v_username
    then

        raise exception
            'USERNAME_NOT_CANONICAL'
            using errcode =
            '22023';

    end if;


    if
        v_username !~
        '^[a-z0-9][a-z0-9._-]{2,49}$'
    then

        raise exception
            'USERNAME_INVALID_FORMAT'
            using errcode =
            '22023';

    end if;


    if
        public._indesy_public_identifier_reserved(
            v_username
        )
    then

        raise exception
            'USERNAME_RESERVED'
            using errcode =
            '22023';

    end if;


    /*
     * Another profile already owns this username.
     *
     * The unique index remains the concurrency guarantee.
     */

    if exists (

        select
            1

        from
            public.profiles p

        where
            lower(
                p.username
            ) =
                v_username

            and
            p.id <>
                new.id

    )
    then

        raise exception
            'USERNAME_TAKEN'
            using errcode =
            '23505';

    end if;


    /*
     * Global Actor namespace:
     *
     * A human profile cannot take an organization Actor handle
     * or another profile Actor handle.
     *
     * Its own existing Actor is excluded.
     */

    if exists (

        select
            1

        from
            public.korana_actors a

        where
            a.handle =
                v_username

            and
            not (
                a.actor_type =
                    'profile'

                and
                a.profile_id =
                    new.id
            )

    )
    then

        raise exception
            'USERNAME_TAKEN'
            using errcode =
            '23505';

    end if;


    return
        new;

end;

$function$;


revoke all
on function
public._indesy_validate_profile_public_identifier()
from public, anon, authenticated;


drop trigger if exists
indesy_profiles_public_identifier_guard
on public.profiles;


create trigger
indesy_profiles_public_identifier_guard

before insert or update of
    username

on public.profiles

for each row

execute function
public._indesy_validate_profile_public_identifier();


-- ============================================================
-- 5. KORANA ACTOR RESERVED HANDLE GUARD
--
-- This is a database backstop for every Actor type.
-- ============================================================

create or replace function
public._indesy_validate_korana_actor_public_identifier()
returns trigger

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

begin

    if
        public._indesy_public_identifier_reserved(
            new.handle
        )
    then

        raise exception
            'KORANA_HANDLE_RESERVED'
            using errcode =
            '22023';

    end if;


    return
        new;

end;

$function$;


revoke all
on function
public._indesy_validate_korana_actor_public_identifier()
from public, anon, authenticated;


drop trigger if exists
indesy_korana_actor_public_identifier_guard
on public.korana_actors;


create trigger
indesy_korana_actor_public_identifier_guard

before insert or update of
    handle

on public.korana_actors

for each row

execute function
public._indesy_validate_korana_actor_public_identifier();


-- ============================================================
-- 6. RESERVED-AWARE KORANA HANDLE ALLOCATOR
--
-- Existing behavior remains:
--
-- 1. base handle
-- 2. deterministic short UUID suffix
-- 3. deterministic full UUID suffix
--
-- New behavior:
--
-- Reserved public routes are treated exactly like occupied
-- handles.
--
-- Consequence:
--
-- - profile usernames are rejected before synchronization;
-- - generated organization handles receive a safe suffix.
-- ============================================================

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

    -- --------------------------------------------------------
    -- Candidate 1
    -- --------------------------------------------------------

    v_candidate :=
        left(
            p_base,
            50
        );


    if
        not public._indesy_public_identifier_reserved(
            v_candidate
        )

        and
        not exists (

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


    -- --------------------------------------------------------
    -- Candidate 2
    -- --------------------------------------------------------

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


    if
        not public._indesy_public_identifier_reserved(
            v_candidate
        )

        and
        not exists (

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


    -- --------------------------------------------------------
    -- Candidate 3
    -- --------------------------------------------------------

    v_candidate :=
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


    if
        not public._indesy_public_identifier_reserved(
            v_candidate
        )

        and
        not exists (

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


    raise exception
        'KORANA_HANDLE_ALLOCATION_EXHAUSTED'
        using errcode =
        '23505';

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
-- 7. PROFILE -> ACTOR EXACT MATCH POST-CONDITION
--
-- PostgreSQL fires same-kind triggers by trigger name.
--
-- The existing trigger:
--
--     korana_profiles_actor_sync
--
-- runs before:
--
--     zz_indesy_profile_actor_handle_match_guard
--
-- Therefore the Actor projection is updated first, then this
-- guard verifies the invariant.
--
-- A race that causes the allocator to suffix a profile handle
-- therefore rolls the entire profile update back.
-- ============================================================

create or replace function
public._indesy_assert_profile_actor_handle_match()
returns trigger

language plpgsql
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

begin

    if not exists (

        select
            1

        from
            public.korana_actors a

        where
            a.actor_type =
                'profile'

            and
            a.profile_id =
                new.id

            and
            a.handle =
                new.username

    )
    then

        raise exception
            'PROFILE_ACTOR_HANDLE_MISMATCH'
            using errcode =
            '23514';

    end if;


    return
        new;

end;

$function$;


revoke all
on function
public._indesy_assert_profile_actor_handle_match()
from public, anon, authenticated;


drop trigger if exists
zz_indesy_profile_actor_handle_match_guard
on public.profiles;


create trigger
zz_indesy_profile_actor_handle_match_guard

after insert or update of
    username

on public.profiles

for each row

execute function
public._indesy_assert_profile_actor_handle_match();


-- ============================================================
-- 8. PUBLIC AVAILABILITY RPC
--
-- Safe for anonymous registration / username selection.
--
-- It does NOT expose the profile or Actor that owns a handle.
--
-- Result example:
--
-- {
--   "available": false,
--   "identifier": "rakoto",
--   "reason": "taken"
-- }
--
-- Reasons:
--
-- - required
-- - not_canonical
-- - invalid_format
-- - reserved
-- - taken
-- - available
-- ============================================================

create or replace function
public.korana_public_identifier_availability(
    p_identifier text
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

    v_raw text;

    v_identifier text;

    v_profile_id uuid;

begin

    v_raw :=
        btrim(
            coalesce(
                p_identifier,
                ''
            )
        );


    v_identifier :=
        lower(
            v_raw
        );


    v_profile_id :=
        auth.uid();


    if
        v_raw =
        ''
    then

        return
            jsonb_build_object(
                'available',
                false,

                'identifier',
                null,

                'reason',
                'required'
            );

    end if;


    if
        v_raw <>
        v_identifier
    then

        return
            jsonb_build_object(
                'available',
                false,

                'identifier',
                v_identifier,

                'reason',
                'not_canonical'
            );

    end if;


    if
        v_identifier !~
        '^[a-z0-9][a-z0-9._-]{2,49}$'
    then

        return
            jsonb_build_object(
                'available',
                false,

                'identifier',
                v_identifier,

                'reason',
                'invalid_format'
            );

    end if;


    if
        public._indesy_public_identifier_reserved(
            v_identifier
        )
    then

        return
            jsonb_build_object(
                'available',
                false,

                'identifier',
                v_identifier,

                'reason',
                'reserved'
            );

    end if;


    /*
     * Profiles.
     *
     * For an authenticated account editing its own username,
     * its current identifier remains available to itself.
     */

    if exists (

        select
            1

        from
            public.profiles p

        where
            lower(
                p.username
            ) =
                v_identifier

            and
            (
                v_profile_id is null

                or
                p.id <>
                    v_profile_id
            )

    )
    then

        return
            jsonb_build_object(
                'available',
                false,

                'identifier',
                v_identifier,

                'reason',
                'taken'
            );

    end if;


    /*
     * Global Korana Actor namespace.
     *
     * Exclude only the authenticated user's own profile Actor.
     * An organization Actor remains a collision even if the
     * current user manages that organization.
     */

    if exists (

        select
            1

        from
            public.korana_actors a

        where
            a.handle =
                v_identifier

            and
            (
                v_profile_id is null

                or
                not (
                    a.actor_type =
                        'profile'

                    and
                    a.profile_id =
                        v_profile_id
                )
            )

    )
    then

        return
            jsonb_build_object(
                'available',
                false,

                'identifier',
                v_identifier,

                'reason',
                'taken'
            );

    end if;


    return
        jsonb_build_object(
            'available',
            true,

            'identifier',
            v_identifier,

            'reason',
            'available'
        );

end;

$function$;


revoke all
on function
public.korana_public_identifier_availability(
    text
)
from public;


grant execute
on function
public.korana_public_identifier_availability(
    text
)
to anon, authenticated;


comment on function
public.korana_public_identifier_availability(
    text
)
is
'Indesy K5-C: privacy-safe public identifier availability check for root public profile URLs.';


commit;