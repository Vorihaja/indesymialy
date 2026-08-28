begin;


-- ============================================================
-- INDESY MIALY
-- CONTROL CENTER
-- G2-A - PERMISSION GOVERNANCE
--
-- Scope:
-- - canonical metadata for admin.* permissions
-- - domain / action / sensitivity classification
-- - canonical has_admin_permission() helper
-- - secure Super Admin governance snapshot
-- - strict validation integrated with G1
--
-- This migration does NOT yet rewrite operational RLS policies.
-- That belongs to G2-B.
-- ============================================================


-- ============================================================
-- 1. ADMIN PERMISSION METADATA
-- ============================================================

create table if not exists
public.admin_permission_metadata (

    permission_id uuid primary key
        references public.permissions(id)
        on delete cascade,

    domain text not null,

    domain_label text not null,

    action text not null,

    action_label text not null,

    sensitivity text not null,

    label text not null,

    display_order integer not null
        default 0,

    is_active boolean not null
        default true,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    admin_permission_metadata_domain_check
    check (
        domain in (
            'dashboard',
            'users',
            'organizations',
            'sport',
            'events',
            'community',
            'marketplace',
            'finance',
            'support',
            'content',
            'analytics'
        )
    ),

    constraint
    admin_permission_metadata_action_check
    check (
        action in (
            'view',
            'manage',
            'approve',
            'export'
        )
    ),

    constraint
    admin_permission_metadata_sensitivity_check
    check (
        sensitivity in (
            'standard',
            'sensitive',
            'critical'
        )
    ),

    constraint
    admin_permission_metadata_label_check
    check (
        char_length(
            btrim(label)
        ) >= 2
    )
);


create index if not exists
admin_permission_metadata_domain_idx

on public.admin_permission_metadata(
    domain,
    display_order
);


create index if not exists
admin_permission_metadata_sensitivity_idx

on public.admin_permission_metadata(
    sensitivity,
    display_order
);


alter table
public.admin_permission_metadata
enable row level security;


revoke all
on table
public.admin_permission_metadata
from public, anon, authenticated;


-- ============================================================
-- 2. CANONICAL CLASSIFICATION OF THE 36 EXISTING PERMISSIONS
-- ============================================================

with metadata (
    code,
    domain,
    domain_label,
    action,
    action_label,
    sensitivity,
    label,
    display_order
)
as (

    values

    (
        'admin.dashboard.view',
        'dashboard',
        'Tableau de bord',
        'view',
        'Consultation',
        'standard',
        'Consulter le tableau de bord Admin',
        10
    ),


    (
        'admin.users.view',
        'users',
        'Utilisateurs',
        'view',
        'Consultation',
        'standard',
        'Consulter les utilisateurs',
        100
    ),

    (
        'admin.users.manage',
        'users',
        'Utilisateurs',
        'manage',
        'Gestion',
        'sensitive',
        'Gérer les utilisateurs',
        110
    ),

    (
        'admin.users.approve',
        'users',
        'Utilisateurs',
        'approve',
        'Approbation',
        'critical',
        'Valider les utilisateurs et dossiers',
        120
    ),

    (
        'admin.users.export',
        'users',
        'Utilisateurs',
        'export',
        'Export',
        'critical',
        'Exporter les données utilisateurs',
        130
    ),


    (
        'admin.organizations.view',
        'organizations',
        'Organisations',
        'view',
        'Consultation',
        'standard',
        'Consulter les organisations',
        200
    ),

    (
        'admin.organizations.manage',
        'organizations',
        'Organisations',
        'manage',
        'Gestion',
        'sensitive',
        'Gérer les organisations',
        210
    ),

    (
        'admin.organizations.approve',
        'organizations',
        'Organisations',
        'approve',
        'Approbation',
        'critical',
        'Valider les organisations',
        220
    ),

    (
        'admin.organizations.export',
        'organizations',
        'Organisations',
        'export',
        'Export',
        'sensitive',
        'Exporter les données organisations',
        230
    ),


    (
        'admin.sport.view',
        'sport',
        'Sport',
        'view',
        'Consultation',
        'standard',
        'Consulter les données sportives',
        300
    ),

    (
        'admin.sport.manage',
        'sport',
        'Sport',
        'manage',
        'Gestion',
        'sensitive',
        'Gérer les données sportives',
        310
    ),

    (
        'admin.sport.approve',
        'sport',
        'Sport',
        'approve',
        'Approbation',
        'critical',
        'Valider les opérations sportives',
        320
    ),

    (
        'admin.sport.export',
        'sport',
        'Sport',
        'export',
        'Export',
        'sensitive',
        'Exporter les données sportives',
        330
    ),


    (
        'admin.events.view',
        'events',
        'Événements',
        'view',
        'Consultation',
        'standard',
        'Consulter les événements',
        400
    ),

    (
        'admin.events.manage',
        'events',
        'Événements',
        'manage',
        'Gestion',
        'sensitive',
        'Gérer les événements',
        410
    ),

    (
        'admin.events.approve',
        'events',
        'Événements',
        'approve',
        'Approbation',
        'critical',
        'Valider les événements',
        420
    ),

    (
        'admin.events.export',
        'events',
        'Événements',
        'export',
        'Export',
        'sensitive',
        'Exporter les données événements',
        430
    ),


    (
        'admin.community.view',
        'community',
        'Community',
        'view',
        'Consultation',
        'standard',
        'Consulter les données communautaires',
        500
    ),

    (
        'admin.community.manage',
        'community',
        'Community',
        'manage',
        'Gestion',
        'sensitive',
        'Gérer les espaces communautaires',
        510
    ),

    (
        'admin.community.approve',
        'community',
        'Community',
        'approve',
        'Approbation',
        'critical',
        'Valider les décisions communautaires',
        520
    ),

    (
        'admin.community.export',
        'community',
        'Community',
        'export',
        'Export',
        'sensitive',
        'Exporter les données communautaires',
        530
    ),


    (
        'admin.marketplace.view',
        'marketplace',
        'Marketplace',
        'view',
        'Consultation',
        'standard',
        'Consulter la Marketplace',
        600
    ),

    (
        'admin.marketplace.manage',
        'marketplace',
        'Marketplace',
        'manage',
        'Gestion',
        'sensitive',
        'Gérer la Marketplace',
        610
    ),

    (
        'admin.marketplace.approve',
        'marketplace',
        'Marketplace',
        'approve',
        'Approbation',
        'critical',
        'Valider les opérations Marketplace',
        620
    ),

    (
        'admin.marketplace.export',
        'marketplace',
        'Marketplace',
        'export',
        'Export',
        'sensitive',
        'Exporter les données Marketplace',
        630
    ),


    (
        'admin.finance.view',
        'finance',
        'Finance',
        'view',
        'Consultation',
        'sensitive',
        'Consulter les données financières',
        700
    ),

    (
        'admin.finance.manage',
        'finance',
        'Finance',
        'manage',
        'Gestion',
        'critical',
        'Gérer les opérations financières',
        710
    ),

    (
        'admin.finance.approve',
        'finance',
        'Finance',
        'approve',
        'Approbation',
        'critical',
        'Approuver les opérations financières',
        720
    ),

    (
        'admin.finance.export',
        'finance',
        'Finance',
        'export',
        'Export',
        'critical',
        'Exporter les données financières',
        730
    ),


    (
        'admin.support.view',
        'support',
        'Support',
        'view',
        'Consultation',
        'standard',
        'Consulter le support',
        800
    ),

    (
        'admin.support.manage',
        'support',
        'Support',
        'manage',
        'Gestion',
        'sensitive',
        'Gérer les demandes de support',
        810
    ),


    (
        'admin.content.view',
        'content',
        'Contenu',
        'view',
        'Consultation',
        'standard',
        'Consulter les contenus',
        900
    ),

    (
        'admin.content.manage',
        'content',
        'Contenu',
        'manage',
        'Gestion',
        'sensitive',
        'Gérer les contenus',
        910
    ),

    (
        'admin.content.approve',
        'content',
        'Contenu',
        'approve',
        'Approbation',
        'critical',
        'Approuver les contenus',
        920
    ),


    (
        'admin.analytics.view',
        'analytics',
        'Analytics',
        'view',
        'Consultation',
        'standard',
        'Consulter les Analytics administratives',
        1000
    ),

    (
        'admin.analytics.export',
        'analytics',
        'Analytics',
        'export',
        'Export',
        'sensitive',
        'Exporter les Analytics',
        1010
    )

)

insert into
public.admin_permission_metadata (

    permission_id,

    domain,

    domain_label,

    action,

    action_label,

    sensitivity,

    label,

    display_order,

    is_active,

    created_at,

    updated_at

)

select

    p.id,

    m.domain,

    m.domain_label,

    m.action,

    m.action_label,

    m.sensitivity,

    m.label,

    m.display_order,

    true,

    now(),

    now()

from
    metadata m

join
    public.permissions p
    on p.code =
       m.code

on conflict (
    permission_id
)
do update

set

    domain =
        excluded.domain,

    domain_label =
        excluded.domain_label,

    action =
        excluded.action,

    action_label =
        excluded.action_label,

    sensitivity =
        excluded.sensitivity,

    label =
        excluded.label,

    display_order =
        excluded.display_order,

    is_active =
        true,

    updated_at =
        now();


-- ============================================================
-- 3. STRICT G1 VALIDATION NOW USES THE G2-A CATALOG
--
-- An admin.* permission is assignable only if:
-- - the permission exists
-- - it has canonical G2 metadata
-- - the metadata is active
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

            join
                public.admin_permission_metadata m
                on m.permission_id =
                   p.id

            where
                p.code =
                requested

              and
                m.is_active =
                true

        );


    if
        cardinality(
            v_invalid
        ) >
        0
    then

        raise exception
            'Permission(s) Admin absente(s), inactive(s) ou non classifiée(s) : %',
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
-- 4. CANONICAL ADMIN PERMISSION CHECK
--
-- IMPORTANT:
-- super_admin does NOT inherit Admin operational permissions.
-- ============================================================

create or replace function
public.has_admin_permission(
    p_code text
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

        not exists (

            select
                1

            from
                public.profile_system_roles psr_super

            join
                public.system_roles sr_super
                on sr_super.id =
                   psr_super.system_role_id

            where
                psr_super.profile_id =
                auth.uid()

              and
                sr_super.code =
                'super_admin'

        )

        and

        exists (

            select
                1

            from
                public.admin_permission_grants apg

            join
                public.permissions p
                on p.id =
                   apg.permission_id

            join
                public.admin_permission_metadata metadata
                on metadata.permission_id =
                   p.id

            join
                public.admin_governance_state governance
                on governance.profile_id =
                   apg.profile_id

            where
                apg.profile_id =
                auth.uid()

              and
                p.code =
                btrim(
                    coalesce(
                        p_code,
                        ''
                    )
                )

              and
                p.code like
                'admin.%'

              and
                metadata.is_active =
                true

              and
                governance.status =
                'active'

              and
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
                        auth.uid()

                      and
                        sr.code =
                        'admin'

                )

        );

$function$;


revoke all
on function
public.has_admin_permission(
    text
)
from public, anon;


grant execute
on function
public.has_admin_permission(
    text
)
to authenticated;


-- ============================================================
-- 5. ANY / ALL HELPERS FOR G2-B
-- ============================================================

create or replace function
public.has_any_admin_permission(
    p_codes text[]
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

        cardinality(
            coalesce(
                p_codes,
                '{}'::text[]
            )
        ) >
        0

        and

        exists (

            select
                1

            from
                unnest(
                    coalesce(
                        p_codes,
                        '{}'::text[]
                    )
                ) code

            where
                public.has_admin_permission(
                    code
                )

        );

$function$;


revoke all
on function
public.has_any_admin_permission(
    text[]
)
from public, anon;


grant execute
on function
public.has_any_admin_permission(
    text[]
)
to authenticated;


create or replace function
public.has_all_admin_permissions(
    p_codes text[]
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

        cardinality(
            coalesce(
                p_codes,
                '{}'::text[]
            )
        ) >
        0

        and

        not exists (

            select
                1

            from
                unnest(
                    coalesce(
                        p_codes,
                        '{}'::text[]
                    )
                ) code

            where
                not public.has_admin_permission(
                    code
                )

        );

$function$;


revoke all
on function
public.has_all_admin_permissions(
    text[]
)
from public, anon;


grant execute
on function
public.has_all_admin_permissions(
    text[]
)
to authenticated;


-- ============================================================
-- 6. CANONICAL SUPER ADMIN PERMISSION CATALOG
--
-- G1 continues to consume this function.
-- Extra G2 fields remain backward-compatible.
-- ============================================================

create or replace function
public.super_admin_list_permission_catalog()
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


    select
        coalesce(

            jsonb_agg(

                jsonb_build_object(

                    'id',
                        p.id,

                    'code',
                        p.code,

                    'description',
                        p.description,

                    'label',
                        m.label,

                    'domain',
                        m.domain,

                    'domainLabel',
                        m.domain_label,

                    'action',
                        m.action,

                    'actionLabel',
                        m.action_label,

                    'sensitivity',
                        m.sensitivity,

                    'displayOrder',
                        m.display_order,

                    'isActive',
                        m.is_active

                )

                order by
                    m.display_order,
                    p.code

            ),

            '[]'::jsonb

        )

    into
        v_result

    from
        public.permissions p

    join
        public.admin_permission_metadata m
        on m.permission_id =
           p.id

    where
        p.code like
        'admin.%'

      and
        m.is_active =
        true;


    return
        v_result;

end;

$function$;


revoke all
on function
public.super_admin_list_permission_catalog()
from public, anon;


grant execute
on function
public.super_admin_list_permission_catalog()
to authenticated;


-- ============================================================
-- 7. G2-A GOVERNANCE SNAPSHOT
-- ============================================================

create or replace function
public.super_admin_permissions_governance_snapshot()
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


    select
        jsonb_build_object(


            -- ------------------------------------------------
            -- SUMMARY
            -- ------------------------------------------------

            'summary',

            jsonb_build_object(

                'totalPermissions',

                    (
                        select
                            count(*)

                        from
                            public.admin_permission_metadata m

                        join
                            public.permissions p
                            on p.id =
                               m.permission_id

                        where
                            m.is_active =
                            true

                          and
                            p.code like
                            'admin.%'
                    ),


                'standardPermissions',

                    (
                        select
                            count(*)

                        from
                            public.admin_permission_metadata m

                        join
                            public.permissions p
                            on p.id =
                               m.permission_id

                        where
                            m.is_active =
                            true

                          and
                            m.sensitivity =
                            'standard'

                          and
                            p.code like
                            'admin.%'
                    ),


                'sensitivePermissions',

                    (
                        select
                            count(*)

                        from
                            public.admin_permission_metadata m

                        join
                            public.permissions p
                            on p.id =
                               m.permission_id

                        where
                            m.is_active =
                            true

                          and
                            m.sensitivity =
                            'sensitive'

                          and
                            p.code like
                            'admin.%'
                    ),


                'criticalPermissions',

                    (
                        select
                            count(*)

                        from
                            public.admin_permission_metadata m

                        join
                            public.permissions p
                            on p.id =
                               m.permission_id

                        where
                            m.is_active =
                            true

                          and
                            m.sensitivity =
                            'critical'

                          and
                            p.code like
                            'admin.%'
                    ),


                'activeAdministrators',

                    (
                        select
                            count(*)

                        from
                            public.admin_governance_state gs

                        where
                            gs.status =
                            'active'

                          and
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
                                    gs.profile_id

                                  and
                                    sr.code =
                                    'admin'

                            )
                    ),


                'activeAssignments',

                    (
                        select
                            count(*)

                        from
                            public.admin_permission_grants apg

                        join
                            public.admin_governance_state gs
                            on gs.profile_id =
                               apg.profile_id

                        join
                            public.admin_permission_metadata m
                            on m.permission_id =
                               apg.permission_id

                        where
                            gs.status =
                            'active'

                          and
                            m.is_active =
                            true

                          and
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
                                    apg.profile_id

                                  and
                                    sr.code =
                                    'admin'

                            )
                    )

            ),


            -- ------------------------------------------------
            -- CATALOG
            -- ------------------------------------------------

            'catalog',

            coalesce(

                (

                    select
                        jsonb_agg(

                            jsonb_build_object(

                                'id',
                                    p.id,

                                'code',
                                    p.code,

                                'description',
                                    p.description,

                                'label',
                                    m.label,

                                'domain',
                                    m.domain,

                                'domainLabel',
                                    m.domain_label,

                                'action',
                                    m.action,

                                'actionLabel',
                                    m.action_label,

                                'sensitivity',
                                    m.sensitivity,

                                'displayOrder',
                                    m.display_order,

                                'isActive',
                                    m.is_active,

                                'assignedCount',

                                    (
                                        select
                                            count(*)

                                        from
                                            public.admin_permission_grants apg

                                        join
                                            public.admin_governance_state gs
                                            on gs.profile_id =
                                               apg.profile_id

                                        where
                                            apg.permission_id =
                                            p.id

                                          and
                                            gs.status =
                                            'active'

                                          and
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
                                                    apg.profile_id

                                                  and
                                                    sr.code =
                                                    'admin'

                                            )
                                    )

                            )

                            order by
                                m.display_order,
                                p.code

                        )

                    from
                        public.permissions p

                    join
                        public.admin_permission_metadata m
                        on m.permission_id =
                           p.id

                    where
                        p.code like
                        'admin.%'

                      and
                        m.is_active =
                        true

                ),

                '[]'::jsonb

            ),


            -- ------------------------------------------------
            -- ADMINISTRATORS
            -- ------------------------------------------------

            'administrators',

            coalesce(

                (

                    select
                        jsonb_agg(

                            jsonb_build_object(

                                'profileId',
                                    q.profile_id,

                                'fullName',
                                    q.full_name,

                                'email',
                                    q.email,

                                'governanceStatus',
                                    q.governance_status,

                                'roleAssigned',
                                    q.role_assigned,

                                'effectiveAccess',
                                    q.effective_access,

                                'consistent',
                                    q.consistent,

                                'permissions',
                                    q.permissions,

                                'permissionSnapshot',
                                    q.permission_snapshot

                            )

                            order by

                                case
                                    q.governance_status

                                    when 'active'
                                        then 1

                                    when 'suspended'
                                        then 2

                                    else 3
                                end,

                                lower(
                                    coalesce(
                                        q.full_name,
                                        ''
                                    )
                                )

                        )

                    from (

                        select

                            gs.profile_id,

                            p.full_name,

                            p.email,

                            gs.status
                                as governance_status,


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
                                    gs.profile_id

                                  and
                                    sr.code =
                                    'admin'

                            )
                                as role_assigned,


                            (
                                gs.status =
                                'active'

                                and

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
                                        gs.profile_id

                                      and
                                        sr.code =
                                        'admin'

                                )
                            )
                                as effective_access,


                            (
                                (
                                    gs.status =
                                    'active'

                                    and

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
                                            gs.profile_id

                                          and
                                            sr.code =
                                            'admin'

                                    )
                                )

                                or

                                (
                                    gs.status in (
                                        'suspended',
                                        'revoked'
                                    )

                                    and

                                    not exists (

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
                                            gs.profile_id

                                          and
                                            sr.code =
                                            'admin'

                                    )
                                )
                            )
                                as consistent,


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

                                    join
                                        public.admin_permission_metadata metadata
                                        on metadata.permission_id =
                                           perm.id

                                    where
                                        apg.profile_id =
                                        gs.profile_id

                                      and
                                        metadata.is_active =
                                        true

                                ),

                                '[]'::jsonb

                            )
                                as permissions,


                            to_jsonb(
                                coalesce(
                                    gs.permission_snapshot,
                                    '{}'::text[]
                                )
                            )
                                as permission_snapshot


                        from
                            public.admin_governance_state gs

                        join
                            public.profiles p
                            on p.id =
                               gs.profile_id

                    ) q

                ),

                '[]'::jsonb

            )

        )

    into
        v_result;


    return
        v_result;

end;

$function$;


revoke all
on function
public.super_admin_permissions_governance_snapshot()
from public, anon;


grant execute
on function
public.super_admin_permissions_governance_snapshot()
to authenticated;


commit;