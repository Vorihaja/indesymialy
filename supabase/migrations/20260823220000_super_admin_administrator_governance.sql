begin;


-- ============================================================
-- INDESY MIALY
-- CONTROL CENTER
-- G1 - ADMINISTRATOR GOVERNANCE
-- ============================================================


-- ============================================================
-- 1. GOVERNANCE STATE
-- ============================================================

create table if not exists
public.admin_governance_state (

    profile_id uuid primary key
        references public.profiles(id)
        on delete cascade,

    status text not null
        default 'active',

    permission_snapshot text[] not null
        default '{}'::text[],

    admin_since timestamptz,

    suspended_at timestamptz,

    revoked_at timestamptz,

    reactivated_at timestamptz,

    last_reason text,

    changed_by uuid
        references public.profiles(id)
        on delete set null,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    admin_governance_state_status_check
    check (
        status in (
            'active',
            'suspended',
            'revoked'
        )
    ),

    constraint
    admin_governance_state_reason_length_check
    check (
        last_reason is null
        or
        char_length(last_reason)
            <= 500
    )

);


create index if not exists
admin_governance_state_status_idx

on public.admin_governance_state(
    status,
    updated_at desc
);


alter table
public.admin_governance_state
enable row level security;


revoke all
on table
public.admin_governance_state
from anon, authenticated;


-- ============================================================
-- 2. MIGRATE CURRENT ADMINS
-- ============================================================

insert into
public.admin_governance_state (

    profile_id,

    status,

    permission_snapshot,

    admin_since,

    last_reason,

    created_at,

    updated_at

)

select

    psr.profile_id,

    'active',

    coalesce(

        array(

            select
                perm.code

            from
                public.admin_permission_grants apg

            join
                public.permissions perm
                on perm.id =
                   apg.permission_id

            where
                apg.profile_id =
                psr.profile_id

            order by
                perm.code

        ),

        '{}'::text[]

    ),

    min(
        psr.created_at
    ),

    'État initial importé lors de la mise en place de G1.',

    now(),

    now()

from
    public.profile_system_roles psr

join
    public.system_roles sr
    on sr.id =
       psr.system_role_id

where
    sr.code =
    'admin'

group by
    psr.profile_id

on conflict (
    profile_id
)
do nothing;


-- ============================================================
-- 3. NORMALIZE GOVERNANCE REASON
-- ============================================================

create or replace function
public._admin_governance_reason(
    p_reason text,
    p_required boolean
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

    v_reason text;

begin

    v_reason :=
        nullif(
            btrim(
                coalesce(
                    p_reason,
                    ''
                )
            ),
            ''
        );


    if
        coalesce(
            p_required,
            true
        )
        and
        (
            v_reason is null
            or
            char_length(
                v_reason
            ) < 3
        )
    then

        raise exception
            'Un motif de gouvernance d''au moins 3 caractères est obligatoire.';

    end if;


    if
        v_reason is not null
        and
        char_length(
            v_reason
        ) > 500
    then

        raise exception
            'Le motif de gouvernance est limité à 500 caractères.';

    end if;


    return
        v_reason;

end;

$function$;


revoke all
on function
public._admin_governance_reason(
    text,
    boolean
)
from public, anon, authenticated;


-- ============================================================
-- 4. STRICT PERMISSION VALIDATION
-- ============================================================

create or replace function
public._validate_admin_permission_codes(
    p_codes text[]
)
returns text[]

language plpgsql
stable
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_requested text[];

    v_invalid text[];

begin

    select
        coalesce(
            array_agg(
                q.code
                order by q.code
            ),
            '{}'::text[]
        )

    into
        v_requested

    from (

        select distinct
            btrim(
                value
            ) as code

        from
            unnest(
                coalesce(
                    p_codes,
                    '{}'::text[]
                )
            ) as value

        where
            nullif(
                btrim(
                    value
                ),
                ''
            )
            is not null

    ) q;


    select
        coalesce(
            array_agg(
                requested
                order by requested
            ),
            '{}'::text[]
        )

    into
        v_invalid

    from
        unnest(
            v_requested
        ) requested

    where

        requested not like
            'admin.%'

        or

        not exists (

            select
                1

            from
                public.permissions p

            where
                p.code =
                requested

        );


    if
        cardinality(
            v_invalid
        ) >
        0
    then

        raise exception
            'Permission(s) administrateur invalide(s) : %',
            array_to_string(
                v_invalid,
                ', '
            );

    end if;


    return
        v_requested;

end;

$function$;


revoke all
on function
public._validate_admin_permission_codes(
    text[]
)
from public, anon, authenticated;


-- ============================================================
-- 5. GOVERNANCE LIST
-- ============================================================

create or replace function
public.super_admin_list_administrator_governance()
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

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode =
            '42501';

    end if;


    with current_admin_roles as (

        select

            psr.profile_id,

            true as role_assigned,

            min(
                psr.created_at
            ) as role_since

        from
            public.profile_system_roles psr

        join
            public.system_roles sr
            on sr.id =
               psr.system_role_id

        where
            sr.code =
            'admin'

        group by
            psr.profile_id

    ),

    governance_rows as (

        select

            gs.profile_id,

            gs.status,

            gs.permission_snapshot,

            coalesce(
                gs.admin_since,
                car.role_since
            ) as admin_since,

            gs.suspended_at,

            gs.revoked_at,

            gs.reactivated_at,

            gs.last_reason,

            gs.changed_by,

            gs.created_at,

            gs.updated_at,

            coalesce(
                car.role_assigned,
                false
            ) as role_assigned

        from
            public.admin_governance_state gs

        left join
            current_admin_roles car
            on car.profile_id =
               gs.profile_id


        union all


        select

            car.profile_id,

            'active'::text,

            '{}'::text[],

            car.role_since,

            null::timestamptz,

            null::timestamptz,

            null::timestamptz,

            'Administrateur legacy sans état G1.'::text,

            null::uuid,

            car.role_since,

            car.role_since,

            true

        from
            current_admin_roles car

        where
            not exists (

                select
                    1

                from
                    public.admin_governance_state gs

                where
                    gs.profile_id =
                    car.profile_id

            )

    )

    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'profileId',
                        g.profile_id,

                    'fullName',
                        p.full_name,

                    'email',
                        p.email,

                    'profileStatus',
                        p.status,

                    'verified',
                        coalesce(
                            p.is_verified,
                            false
                        ),

                    'governanceStatus',
                        g.status,

                    'roleAssigned',
                        g.role_assigned,

                    'effectiveAccess',
                        (
                            g.status =
                                'active'
                            and
                            g.role_assigned
                        ),

                    'consistent',
                        (
                            (
                                g.status =
                                    'active'
                                and
                                g.role_assigned
                            )
                            or
                            (
                                g.status in (
                                    'suspended',
                                    'revoked'
                                )
                                and
                                not g.role_assigned
                            )
                        ),

                    'adminSince',
                        g.admin_since,

                    'suspendedAt',
                        g.suspended_at,

                    'revokedAt',
                        g.revoked_at,

                    'reactivatedAt',
                        g.reactivated_at,

                    'lastReason',
                        g.last_reason,

                    'updatedAt',
                        g.updated_at,

                    'changedByProfileId',
                        g.changed_by,

                    'changedByName',
                        actor.full_name,

                    'permissions',
                        coalesce(

                            (

                                select
                                    jsonb_agg(
                                        perm.code
                                        order by
                                            perm.code
                                    )

                                from
                                    public.admin_permission_grants apg

                                join
                                    public.permissions perm
                                    on perm.id =
                                       apg.permission_id

                                where
                                    apg.profile_id =
                                    g.profile_id

                            ),

                            '[]'::jsonb

                        ),

                    'permissionSnapshot',
                        to_jsonb(
                            coalesce(
                                g.permission_snapshot,
                                '{}'::text[]
                            )
                        )

                )

                order by

                    case g.status

                        when 'active'
                            then 1

                        when 'suspended'
                            then 2

                        else 3

                    end,

                    lower(
                        coalesce(
                            p.full_name,
                            ''
                        )
                    )

            ),

            '[]'::jsonb

        )

    into
        v_result

    from
        governance_rows g

    join
        public.profiles p
        on p.id =
           g.profile_id

    left join
        public.profiles actor
        on actor.id =
           g.changed_by;


    return
        v_result;

end;

$function$;


revoke all
on function
public.super_admin_list_administrator_governance()
from public, anon;


grant execute
on function
public.super_admin_list_administrator_governance()
to authenticated;


-- ============================================================
-- 6. SEARCH ADMIN CANDIDATES
-- ============================================================

create or replace function
public.super_admin_search_administrator_candidates(

    p_query text,

    p_limit integer
        default 25

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

    v_query text;

    v_result jsonb;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode =
            '42501';

    end if;


    v_query :=
        btrim(
            coalesce(
                p_query,
                ''
            )
        );


    if
        char_length(
            v_query
        ) < 2
    then

        return
            '[]'::jsonb;

    end if;


    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'profileId',
                        q.profile_id,

                    'fullName',
                        q.full_name,

                    'email',
                        q.email,

                    'profileStatus',
                        q.profile_status,

                    'verified',
                        q.verified,

                    'isAdmin',
                        q.is_admin,

                    'isSuperAdmin',
                        q.is_super_admin,

                    'governanceStatus',
                        q.governance_status,

                    'effectiveAccess',
                        (
                            q.governance_status =
                                'active'
                            and
                            q.is_admin
                        )

                )

                order by
                    lower(
                        q.full_name
                    )

            ),

            '[]'::jsonb

        )

    into
        v_result

    from (

        select

            p.id as profile_id,

            p.full_name,

            p.email,

            p.status as profile_status,

            coalesce(
                p.is_verified,
                false
            ) as verified,

            exists (

                select
                    1

                from
                    public.profile_system_roles psr

                join
                    public.system_roles sr
                    on sr.id =
                       psr.system_role_id

                where
                    psr.profile_id =
                    p.id

                  and
                    sr.code =
                    'admin'

            ) as is_admin,

            exists (

                select
                    1

                from
                    public.profile_system_roles psr

                join
                    public.system_roles sr
                    on sr.id =
                       psr.system_role_id

                where
                    psr.profile_id =
                    p.id

                  and
                    sr.code =
                    'super_admin'

            ) as is_super_admin,

            gs.status as governance_status

        from
            public.profiles p

        left join
            public.admin_governance_state gs
            on gs.profile_id =
               p.id

        where

            p.full_name ilike
                '%' || v_query || '%'

            or

            p.email ilike
                '%' || v_query || '%'

            or

            p.username ilike
                '%' || v_query || '%'

        order by
            lower(
                p.full_name
            )

        limit
            greatest(
                1,
                least(
                    coalesce(
                        p_limit,
                        25
                    ),
                    50
                )
            )

    ) q;


    return
        v_result;

end;

$function$;


revoke all
on function
public.super_admin_search_administrator_candidates(
    text,
    integer
)
from public, anon;


grant execute
on function
public.super_admin_search_administrator_candidates(
    text,
    integer
)
to authenticated;


-- ============================================================
-- 7. GRANT ADMIN
-- ============================================================

create or replace function
public.super_admin_grant_administrator(

    p_profile_id uuid,

    p_reason text

)
returns jsonb

language plpgsql
volatile
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_reason text;

    v_admin_role_id uuid;

    v_previous_status text;

    v_target_is_super_admin boolean;

    v_role_exists boolean;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode =
            '42501';

    end if;


    v_reason :=
        public._admin_governance_reason(
            p_reason,
            true
        );


    if not exists (

        select
            1

        from
            public.profiles p

        where
            p.id =
            p_profile_id

    ) then

        raise exception
            'Profil cible introuvable.';

    end if;


    select exists (

        select
            1

        from
            public.profile_system_roles psr

        join
            public.system_roles sr
            on sr.id =
               psr.system_role_id

        where
            psr.profile_id =
            p_profile_id

          and
            sr.code =
            'super_admin'

    )
    into
        v_target_is_super_admin;


    if
        v_target_is_super_admin
    then

        raise exception
            'Un compte Super Admin ne peut pas être administré depuis cette interface.';

    end if;


    select
        status

    into
        v_previous_status

    from
        public.admin_governance_state

    where
        profile_id =
        p_profile_id;


    if
        v_previous_status =
        'suspended'
    then

        raise exception
            'Cet administrateur est suspendu. Utilisez la réactivation afin de conserver la traçabilité.';

    end if;


    select
        id

    into
        v_admin_role_id

    from
        public.system_roles

    where
        code =
        'admin'

    limit 1;


    if
        v_admin_role_id is null
    then

        raise exception
            'Le rôle système admin est introuvable.';

    end if;


    select exists (

        select
            1

        from
            public.profile_system_roles psr

        where
            psr.profile_id =
            p_profile_id

          and
            psr.system_role_id =
            v_admin_role_id

    )
    into
        v_role_exists;


    if
        v_previous_status =
            'active'
        and
        v_role_exists
    then

        return
            jsonb_build_object(
                'changed',
                    false,
                'status',
                    'active'
            );

    end if;


    delete from
        public.admin_permission_grants

    where
        profile_id =
        p_profile_id;


    insert into
    public.profile_system_roles (

        profile_id,

        system_role_id

    )

    select

        p_profile_id,

        v_admin_role_id

    where
        not exists (

            select
                1

            from
                public.profile_system_roles

            where
                profile_id =
                p_profile_id

              and
                system_role_id =
                v_admin_role_id

        );


    insert into
    public.admin_governance_state (

        profile_id,

        status,

        permission_snapshot,

        admin_since,

        suspended_at,

        revoked_at,

        reactivated_at,

        last_reason,

        changed_by,

        created_at,

        updated_at

    )

    values (

        p_profile_id,

        'active',

        '{}'::text[],

        now(),

        null,

        null,

        null,

        v_reason,

        auth.uid(),

        now(),

        now()

    )

    on conflict (
        profile_id
    )
    do update

    set

        status =
            'active',

        permission_snapshot =
            '{}'::text[],

        admin_since =
            now(),

        suspended_at =
            null,

        revoked_at =
            null,

        reactivated_at =
            null,

        last_reason =
            excluded.last_reason,

        changed_by =
            excluded.changed_by,

        updated_at =
            now();


    insert into
    public.admin_access_logs (

        actor_profile_id,

        target_profile_id,

        action,

        details

    )

    values (

        auth.uid(),

        p_profile_id,

        'ADMIN_GOVERNANCE_GRANTED',

        jsonb_build_object(

            'previousStatus',
                v_previous_status,

            'newStatus',
                'active',

            'reason',
                v_reason,

            'permissions',
                '[]'::jsonb

        )

    );


    return
        jsonb_build_object(

            'changed',
                true,

            'status',
                'active'

        );

end;

$function$;


revoke all
on function
public.super_admin_grant_administrator(
    uuid,
    text
)
from public, anon;


grant execute
on function
public.super_admin_grant_administrator(
    uuid,
    text
)
to authenticated;


-- ============================================================
-- 8. SUSPEND ADMIN
-- ============================================================

create or replace function
public.super_admin_suspend_administrator(

    p_profile_id uuid,

    p_reason text

)
returns jsonb

language plpgsql
volatile
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_reason text;

    v_admin_role_id uuid;

    v_status text;

    v_snapshot text[];

    v_target_is_super_admin boolean;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode =
            '42501';

    end if;


    v_reason :=
        public._admin_governance_reason(
            p_reason,
            true
        );


    select exists (

        select
            1

        from
            public.profile_system_roles psr

        join
            public.system_roles sr
            on sr.id =
               psr.system_role_id

        where
            psr.profile_id =
            p_profile_id

          and
            sr.code =
            'super_admin'

    )
    into
        v_target_is_super_admin;


    if
        v_target_is_super_admin
    then

        raise exception
            'Un compte Super Admin ne peut pas être suspendu.';

    end if;


    select
        status

    into
        v_status

    from
        public.admin_governance_state

    where
        profile_id =
        p_profile_id;


    if
        v_status =
        'suspended'
    then

        return
            jsonb_build_object(
                'changed',
                    false,
                'status',
                    'suspended'
            );

    end if;


    if
        v_status =
        'revoked'
    then

        raise exception
            'Cet accès administrateur est déjà révoqué.';

    end if;


    select
        id

    into
        v_admin_role_id

    from
        public.system_roles

    where
        code =
        'admin'

    limit 1;


    if
        v_admin_role_id is null
    then

        raise exception
            'Le rôle système admin est introuvable.';

    end if;


    select
        coalesce(
            array_agg(
                p.code
                order by
                    p.code
            ),
            '{}'::text[]
        )

    into
        v_snapshot

    from
        public.admin_permission_grants apg

    join
        public.permissions p
        on p.id =
           apg.permission_id

    where
        apg.profile_id =
        p_profile_id;


    if
        v_status is null
        and
        not exists (

            select
                1

            from
                public.profile_system_roles psr

            where
                psr.profile_id =
                p_profile_id

              and
                psr.system_role_id =
                v_admin_role_id

        )
    then

        raise exception
            'Le profil cible n''est pas administrateur.';

    end if;


    delete from
        public.admin_permission_grants

    where
        profile_id =
        p_profile_id;


    delete from
        public.profile_system_roles

    where
        profile_id =
        p_profile_id

      and
        system_role_id =
        v_admin_role_id;


    insert into
    public.admin_governance_state (

        profile_id,

        status,

        permission_snapshot,

        admin_since,

        suspended_at,

        last_reason,

        changed_by,

        created_at,

        updated_at

    )

    values (

        p_profile_id,

        'suspended',

        v_snapshot,

        now(),

        now(),

        v_reason,

        auth.uid(),

        now(),

        now()

    )

    on conflict (
        profile_id
    )
    do update

    set

        status =
            'suspended',

        permission_snapshot =
            v_snapshot,

        suspended_at =
            now(),

        last_reason =
            v_reason,

        changed_by =
            auth.uid(),

        updated_at =
            now();


    insert into
    public.admin_access_logs (

        actor_profile_id,

        target_profile_id,

        action,

        details

    )

    values (

        auth.uid(),

        p_profile_id,

        'ADMIN_GOVERNANCE_SUSPENDED',

        jsonb_build_object(

            'previousStatus',
                coalesce(
                    v_status,
                    'active'
                ),

            'newStatus',
                'suspended',

            'reason',
                v_reason,

            'permissionSnapshot',
                to_jsonb(
                    v_snapshot
                )

        )

    );


    return
        jsonb_build_object(

            'changed',
                true,

            'status',
                'suspended',

            'permissionSnapshot',
                to_jsonb(
                    v_snapshot
                )

        );

end;

$function$;


revoke all
on function
public.super_admin_suspend_administrator(
    uuid,
    text
)
from public, anon;


grant execute
on function
public.super_admin_suspend_administrator(
    uuid,
    text
)
to authenticated;


-- ============================================================
-- 9. REACTIVATE ADMIN
-- ============================================================

create or replace function
public.super_admin_reactivate_administrator(

    p_profile_id uuid,

    p_reason text

)
returns jsonb

language plpgsql
volatile
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_reason text;

    v_admin_role_id uuid;

    v_status text;

    v_snapshot text[];

    v_restore text[];

    v_dropped text[];

    v_target_is_super_admin boolean;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode =
            '42501';

    end if;


    v_reason :=
        public._admin_governance_reason(
            p_reason,
            true
        );


    select exists (

        select
            1

        from
            public.profile_system_roles psr

        join
            public.system_roles sr
            on sr.id =
               psr.system_role_id

        where
            psr.profile_id =
            p_profile_id

          and
            sr.code =
            'super_admin'

    )
    into
        v_target_is_super_admin;


    if
        v_target_is_super_admin
    then

        raise exception
            'Un compte Super Admin ne peut pas être administré ici.';

    end if;


    select

        status,

        permission_snapshot

    into

        v_status,

        v_snapshot

    from
        public.admin_governance_state

    where
        profile_id =
        p_profile_id;


    if
        v_status <>
        'suspended'
        or
        v_status is null
    then

        raise exception
            'Seul un administrateur suspendu peut être réactivé.';

    end if;


    select
        id

    into
        v_admin_role_id

    from
        public.system_roles

    where
        code =
        'admin'

    limit 1;


    if
        v_admin_role_id is null
    then

        raise exception
            'Le rôle système admin est introuvable.';

    end if;


    select
        coalesce(
            array_agg(
                p.code
                order by
                    p.code
            ),
            '{}'::text[]
        )

    into
        v_restore

    from
        public.permissions p

    where
        p.code =
        any(
            coalesce(
                v_snapshot,
                '{}'::text[]
            )
        )

      and
        p.code like
        'admin.%';


    select
        coalesce(
            array_agg(
                code
                order by
                    code
            ),
            '{}'::text[]
        )

    into
        v_dropped

    from
        unnest(
            coalesce(
                v_snapshot,
                '{}'::text[]
            )
        ) code

    where
        not (
            code =
            any(
                v_restore
            )
        );


    insert into
    public.profile_system_roles (

        profile_id,

        system_role_id

    )

    select

        p_profile_id,

        v_admin_role_id

    where
        not exists (

            select
                1

            from
                public.profile_system_roles

            where
                profile_id =
                p_profile_id

              and
                system_role_id =
                v_admin_role_id

        );


    delete from
        public.admin_permission_grants

    where
        profile_id =
        p_profile_id;


    insert into
    public.admin_permission_grants (

        profile_id,

        permission_id,

        granted_by

    )

    select

        p_profile_id,

        p.id,

        auth.uid()

    from
        public.permissions p

    where
        p.code =
        any(
            v_restore
        );


    update
        public.admin_governance_state

    set

        status =
            'active',

        permission_snapshot =
            v_restore,

        reactivated_at =
            now(),

        last_reason =
            v_reason,

        changed_by =
            auth.uid(),

        updated_at =
            now()

    where
        profile_id =
        p_profile_id;


    insert into
    public.admin_access_logs (

        actor_profile_id,

        target_profile_id,

        action,

        details

    )

    values (

        auth.uid(),

        p_profile_id,

        'ADMIN_GOVERNANCE_REACTIVATED',

        jsonb_build_object(

            'previousStatus',
                'suspended',

            'newStatus',
                'active',

            'reason',
                v_reason,

            'restoredPermissions',
                to_jsonb(
                    v_restore
                ),

            'droppedPermissions',
                to_jsonb(
                    v_dropped
                )

        )

    );


    return
        jsonb_build_object(

            'changed',
                true,

            'status',
                'active',

            'restoredPermissions',
                to_jsonb(
                    v_restore
                ),

            'droppedPermissions',
                to_jsonb(
                    v_dropped
                )

        );

end;

$function$;


revoke all
on function
public.super_admin_reactivate_administrator(
    uuid,
    text
)
from public, anon;


grant execute
on function
public.super_admin_reactivate_administrator(
    uuid,
    text
)
to authenticated;


-- ============================================================
-- 10. REVOKE ADMIN
-- ============================================================

create or replace function
public.super_admin_revoke_administrator(

    p_profile_id uuid,

    p_reason text

)
returns jsonb

language plpgsql
volatile
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_reason text;

    v_admin_role_id uuid;

    v_status text;

    v_snapshot text[];

    v_existing_snapshot text[];

    v_target_is_super_admin boolean;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode =
            '42501';

    end if;


    v_reason :=
        public._admin_governance_reason(
            p_reason,
            true
        );


    select exists (

        select
            1

        from
            public.profile_system_roles psr

        join
            public.system_roles sr
            on sr.id =
               psr.system_role_id

        where
            psr.profile_id =
            p_profile_id

          and
            sr.code =
            'super_admin'

    )
    into
        v_target_is_super_admin;


    if
        v_target_is_super_admin
    then

        raise exception
            'Un compte Super Admin ne peut pas être révoqué.';

    end if;


    select

        status,

        permission_snapshot

    into

        v_status,

        v_existing_snapshot

    from
        public.admin_governance_state

    where
        profile_id =
        p_profile_id;


    if
        v_status =
        'revoked'
    then

        return
            jsonb_build_object(
                'changed',
                    false,
                'status',
                    'revoked'
            );

    end if;


    select
        id

    into
        v_admin_role_id

    from
        public.system_roles

    where
        code =
        'admin'

    limit 1;


    if
        v_admin_role_id is null
    then

        raise exception
            'Le rôle système admin est introuvable.';

    end if;


    if
        v_status =
        'suspended'
    then

        v_snapshot :=
            coalesce(
                v_existing_snapshot,
                '{}'::text[]
            );

    else

        select
            coalesce(
                array_agg(
                    p.code
                    order by
                        p.code
                ),
                '{}'::text[]
            )

        into
            v_snapshot

        from
            public.admin_permission_grants apg

        join
            public.permissions p
            on p.id =
               apg.permission_id

        where
            apg.profile_id =
            p_profile_id;

    end if;


    if
        v_status is null
        and
        not exists (

            select
                1

            from
                public.profile_system_roles

            where
                profile_id =
                p_profile_id

              and
                system_role_id =
                v_admin_role_id

        )
    then

        raise exception
            'Le profil cible n''est pas administrateur.';

    end if;


    delete from
        public.admin_permission_grants

    where
        profile_id =
        p_profile_id;


    delete from
        public.profile_system_roles

    where
        profile_id =
        p_profile_id

      and
        system_role_id =
        v_admin_role_id;


    insert into
    public.admin_governance_state (

        profile_id,

        status,

        permission_snapshot,

        admin_since,

        revoked_at,

        last_reason,

        changed_by,

        created_at,

        updated_at

    )

    values (

        p_profile_id,

        'revoked',

        v_snapshot,

        now(),

        now(),

        v_reason,

        auth.uid(),

        now(),

        now()

    )

    on conflict (
        profile_id
    )
    do update

    set

        status =
            'revoked',

        permission_snapshot =
            v_snapshot,

        revoked_at =
            now(),

        last_reason =
            v_reason,

        changed_by =
            auth.uid(),

        updated_at =
            now();


    insert into
    public.admin_access_logs (

        actor_profile_id,

        target_profile_id,

        action,

        details

    )

    values (

        auth.uid(),

        p_profile_id,

        'ADMIN_GOVERNANCE_REVOKED',

        jsonb_build_object(

            'previousStatus',
                coalesce(
                    v_status,
                    'active'
                ),

            'newStatus',
                'revoked',

            'reason',
                v_reason,

            'permissionSnapshot',
                to_jsonb(
                    v_snapshot
                )

        )

    );


    return
        jsonb_build_object(

            'changed',
                true,

            'status',
                'revoked'

        );

end;

$function$;


revoke all
on function
public.super_admin_revoke_administrator(
    uuid,
    text
)
from public, anon;


grant execute
on function
public.super_admin_revoke_administrator(
    uuid,
    text
)
to authenticated;


-- ============================================================
-- 11. STRICT PERMISSION UPDATE
-- ============================================================

create or replace function
public.super_admin_set_administrator_permissions(

    p_profile_id uuid,

    p_permission_codes text[],

    p_reason text
        default null

)
returns jsonb

language plpgsql
volatile
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

declare

    v_reason text;

    v_status text;

    v_admin_role_id uuid;

    v_requested text[];

    v_current text[];

    v_target_is_super_admin boolean;

begin

    if not public.is_super_admin() then

        raise exception
            'FORBIDDEN'
            using errcode =
            '42501';

    end if;


    v_reason :=
        public._admin_governance_reason(
            p_reason,
            false
        );


    if
        v_reason is null
    then

        v_reason :=
            'Mise à jour des permissions administrateur.';

    end if;


    select exists (

        select
            1

        from
            public.profile_system_roles psr

        join
            public.system_roles sr
            on sr.id =
               psr.system_role_id

        where
            psr.profile_id =
            p_profile_id

          and
            sr.code =
            'super_admin'

    )
    into
        v_target_is_super_admin;


    if
        v_target_is_super_admin
    then

        raise exception
            'Les permissions d''un Super Admin ne sont pas modifiables ici.';

    end if;


    select
        status

    into
        v_status

    from
        public.admin_governance_state

    where
        profile_id =
        p_profile_id;


    if
        v_status <>
        'active'
        or
        v_status is null
    then

        raise exception
            'Les permissions ne peuvent être modifiées que pour un administrateur actif.';

    end if;


    select
        id

    into
        v_admin_role_id

    from
        public.system_roles

    where
        code =
        'admin'

    limit 1;


    if
        not exists (

            select
                1

            from
                public.profile_system_roles psr

            where
                psr.profile_id =
                p_profile_id

              and
                psr.system_role_id =
                v_admin_role_id

        )
    then

        raise exception
            'Incohérence de gouvernance : le rôle Admin actif est absent.';

    end if;


    v_requested :=
        public._validate_admin_permission_codes(
            p_permission_codes
        );


    select
        coalesce(
            array_agg(
                p.code
                order by
                    p.code
            ),
            '{}'::text[]
        )

    into
        v_current

    from
        public.admin_permission_grants apg

    join
        public.permissions p
        on p.id =
           apg.permission_id

    where
        apg.profile_id =
        p_profile_id;


    if
        v_requested =
        v_current
    then

        return
            jsonb_build_object(

                'changed',
                    false,

                'permissions',
                    to_jsonb(
                        v_current
                    )

            );

    end if;


    delete from
        public.admin_permission_grants

    where
        profile_id =
        p_profile_id;


    insert into
    public.admin_permission_grants (

        profile_id,

        permission_id,

        granted_by

    )

    select

        p_profile_id,

        p.id,

        auth.uid()

    from
        public.permissions p

    where
        p.code =
        any(
            v_requested
        );


    update
        public.admin_governance_state

    set

        permission_snapshot =
            v_requested,

        last_reason =
            v_reason,

        changed_by =
            auth.uid(),

        updated_at =
            now()

    where
        profile_id =
        p_profile_id;


    insert into
    public.admin_access_logs (

        actor_profile_id,

        target_profile_id,

        action,

        details

    )

    values (

        auth.uid(),

        p_profile_id,

        'ADMIN_GOVERNANCE_PERMISSIONS_UPDATED',

        jsonb_build_object(

            'reason',
                v_reason,

            'previousPermissions',
                to_jsonb(
                    v_current
                ),

            'permissions',
                to_jsonb(
                    v_requested
                )

        )

    );


    return
        jsonb_build_object(

            'changed',
                true,

            'permissions',
                to_jsonb(
                    v_requested
                )

        );

end;

$function$;


revoke all
on function
public.super_admin_set_administrator_permissions(
    uuid,
    text[],
    text
)
from public, anon;


grant execute
on function
public.super_admin_set_administrator_permissions(
    uuid,
    text[],
    text
)
to authenticated;


-- ============================================================
-- 12. LEGACY COMPATIBILITY
--
-- Old UI/functions cannot bypass G1.
-- ============================================================

create or replace function
public.super_admin_set_admin_role(

    p_profile_id uuid,

    p_enabled boolean

)
returns void

language plpgsql
volatile
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

begin

    if
        p_enabled
    then

        perform
            public.super_admin_grant_administrator(
                p_profile_id,
                'Attribution Admin via interface de compatibilité.'
            );

    else

        perform
            public.super_admin_revoke_administrator(
                p_profile_id,
                'Révocation Admin via interface de compatibilité.'
            );

    end if;

end;

$function$;


revoke all
on function
public.super_admin_set_admin_role(
    uuid,
    boolean
)
from public, anon;


grant execute
on function
public.super_admin_set_admin_role(
    uuid,
    boolean
)
to authenticated;


create or replace function
public.super_admin_set_admin_permissions(

    p_profile_id uuid,

    p_permission_codes text[]

)
returns void

language plpgsql
volatile
security definer

set search_path =
    pg_catalog,
    public,
    pg_temp

as $function$

begin

    perform
        public.super_admin_set_administrator_permissions(

            p_profile_id,

            p_permission_codes,

            'Mise à jour des permissions via interface de compatibilité.'

        );

end;

$function$;


revoke all
on function
public.super_admin_set_admin_permissions(
    uuid,
    text[]
)
from public, anon;


grant execute
on function
public.super_admin_set_admin_permissions(
    uuid,
    text[]
)
to authenticated;


commit;