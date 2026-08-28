-- ============================================================
-- INDESY MIALY
-- SUPER ADMIN CONTROL CENTER
-- Production foundation
-- ============================================================

begin;

-- ============================================================
-- 1. SUPER ADMIN SECURITY HELPER
-- ============================================================

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profile_system_roles psr
        join public.system_roles sr
          on sr.id = psr.system_role_id
        where psr.profile_id = auth.uid()
          and sr.code = 'super_admin'
    );
$$;

revoke all
on function public.is_super_admin()
from public;

grant execute
on function public.is_super_admin()
to authenticated;


-- ============================================================
-- 2. ADMINISTRATOR INDIVIDUAL PERMISSIONS
-- ============================================================

create table if not exists public.admin_permission_grants (
    id uuid primary key default gen_random_uuid(),

    profile_id uuid not null
        references public.profiles(id)
        on delete cascade,

    permission_id uuid not null
        references public.permissions(id)
        on delete cascade,

    granted_by uuid
        references public.profiles(id)
        on delete set null,

    created_at timestamptz not null default now(),

    constraint admin_permission_grants_profile_permission_key
        unique (profile_id, permission_id)
);

create index if not exists
admin_permission_grants_profile_idx
on public.admin_permission_grants(profile_id);

create index if not exists
admin_permission_grants_permission_idx
on public.admin_permission_grants(permission_id);


-- ============================================================
-- 3. ADMIN ACCESS / GOVERNANCE LOG
-- ============================================================

create table if not exists public.admin_access_logs (
    id uuid primary key default gen_random_uuid(),

    actor_profile_id uuid not null
        references public.profiles(id)
        on delete cascade,

    target_profile_id uuid
        references public.profiles(id)
        on delete set null,

    action text not null,

    details jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);

create index if not exists
admin_access_logs_actor_idx
on public.admin_access_logs(actor_profile_id);

create index if not exists
admin_access_logs_target_idx
on public.admin_access_logs(target_profile_id);

create index if not exists
admin_access_logs_created_at_idx
on public.admin_access_logs(created_at desc);


-- ============================================================
-- 4. RLS
-- ============================================================

alter table public.admin_permission_grants
enable row level security;

alter table public.admin_access_logs
enable row level security;


drop policy if exists
"admin_permission_grants_read"
on public.admin_permission_grants;

create policy
"admin_permission_grants_read"
on public.admin_permission_grants
for select
to authenticated
using (
    profile_id = auth.uid()
    or public.is_super_admin()
);


drop policy if exists
"admin_access_logs_super_admin_read"
on public.admin_access_logs;

create policy
"admin_access_logs_super_admin_read"
on public.admin_access_logs
for select
to authenticated
using (
    public.is_super_admin()
);


grant select
on public.admin_permission_grants
to authenticated;

grant select
on public.admin_access_logs
to authenticated;


-- ============================================================
-- 5. ADMIN PERMISSION CATALOG
-- ============================================================

with seed(code, description) as (
    values

    ('admin.dashboard.view',
     'Consulter le tableau de bord Administrateur'),

    ('admin.users.view',
     'Consulter les utilisateurs'),
    ('admin.users.manage',
     'Gérer les utilisateurs'),
    ('admin.users.approve',
     'Valider les utilisateurs et dossiers'),
    ('admin.users.export',
     'Exporter les données utilisateurs'),

    ('admin.organizations.view',
     'Consulter les organisations'),
    ('admin.organizations.manage',
     'Gérer les organisations'),
    ('admin.organizations.approve',
     'Valider les organisations'),
    ('admin.organizations.export',
     'Exporter les données organisations'),

    ('admin.sport.view',
     'Consulter les données sportives'),
    ('admin.sport.manage',
     'Gérer les données sportives'),
    ('admin.sport.approve',
     'Valider les opérations sportives'),
    ('admin.sport.export',
     'Exporter les données sportives'),

    ('admin.events.view',
     'Consulter les événements'),
    ('admin.events.manage',
     'Gérer les événements'),
    ('admin.events.approve',
     'Valider les événements'),
    ('admin.events.export',
     'Exporter les données événements'),

    ('admin.community.view',
     'Consulter les données communautaires'),
    ('admin.community.manage',
     'Gérer les espaces communautaires'),
    ('admin.community.approve',
     'Valider les décisions communautaires'),
    ('admin.community.export',
     'Exporter les données communautaires'),

    ('admin.marketplace.view',
     'Consulter la Marketplace'),
    ('admin.marketplace.manage',
     'Gérer la Marketplace'),
    ('admin.marketplace.approve',
     'Valider les opérations Marketplace'),
    ('admin.marketplace.export',
     'Exporter les données Marketplace'),

    ('admin.finance.view',
     'Consulter les données financières'),
    ('admin.finance.manage',
     'Gérer les opérations financières'),
    ('admin.finance.approve',
     'Approuver les opérations financières'),
    ('admin.finance.export',
     'Exporter les données financières'),

    ('admin.support.view',
     'Consulter le support'),
    ('admin.support.manage',
     'Gérer les demandes de support'),

    ('admin.content.view',
     'Consulter les contenus'),
    ('admin.content.manage',
     'Gérer les contenus'),
    ('admin.content.approve',
     'Approuver les contenus'),

    ('admin.analytics.view',
     'Consulter les Analytics administratives'),
    ('admin.analytics.export',
     'Exporter les Analytics')
)

insert into public.permissions (
    code,
    description
)
select
    seed.code,
    seed.description
from seed
where not exists (
    select 1
    from public.permissions p
    where p.code = seed.code
);


-- ============================================================
-- 6. CURRENT ADMIN PERMISSIONS
-- ============================================================

create or replace function
public.get_my_admin_permissions()
returns table (
    id uuid,
    code text,
    description text,
    created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
    select
        p.id,
        p.code,
        p.description,
        p.created_at
    from public.admin_permission_grants g
    join public.permissions p
      on p.id = g.permission_id
    where g.profile_id = auth.uid()
    order by p.code;
$$;

revoke all
on function public.get_my_admin_permissions()
from public;

grant execute
on function public.get_my_admin_permissions()
to authenticated;


-- ============================================================
-- 7. LIST ADMINISTRATORS
-- SUPER ADMIN ONLY
-- ============================================================

create or replace function
public.super_admin_list_administrators()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    result jsonb;
begin

    if not public.is_super_admin() then
        raise exception 'FORBIDDEN'
            using errcode = '42501';
    end if;

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'profileId', q.profile_id,
                    'fullName', q.full_name,
                    'email', q.email,
                    'status', q.status,
                    'verified', q.is_verified,
                    'adminSince', q.admin_since,
                    'permissions', q.permissions
                )
                order by q.full_name
            ),
            '[]'::jsonb
        )
    into result
    from (
        select
            p.id as profile_id,
            p.full_name,
            p.email,
            p.status,
            p.is_verified,
            psr.created_at as admin_since,

            coalesce(
                (
                    select jsonb_agg(
                        perm.code
                        order by perm.code
                    )
                    from public.admin_permission_grants apg
                    join public.permissions perm
                      on perm.id = apg.permission_id
                    where apg.profile_id = p.id
                ),
                '[]'::jsonb
            ) as permissions

        from public.profile_system_roles psr

        join public.system_roles sr
          on sr.id = psr.system_role_id

        join public.profiles p
          on p.id = psr.profile_id

        where sr.code = 'admin'
    ) q;

    return result;
end;
$$;

revoke all
on function public.super_admin_list_administrators()
from public;

grant execute
on function public.super_admin_list_administrators()
to authenticated;


-- ============================================================
-- 8. ACTIVATE / REVOKE ADMIN ROLE
-- ============================================================

create or replace function
public.super_admin_set_admin_role(
    p_profile_id uuid,
    p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_admin_role_id uuid;
begin

    if not public.is_super_admin() then
        raise exception 'FORBIDDEN'
            using errcode = '42501';
    end if;


    select id
    into v_admin_role_id
    from public.system_roles
    where code = 'admin'
    limit 1;


    if v_admin_role_id is null then
        raise exception
            'Le rôle système admin est introuvable.';
    end if;


    if p_enabled then

        insert into public.profile_system_roles (
            profile_id,
            system_role_id
        )
        select
            p_profile_id,
            v_admin_role_id
        where not exists (
            select 1
            from public.profile_system_roles
            where profile_id = p_profile_id
              and system_role_id = v_admin_role_id
        );

    else

        delete from public.profile_system_roles
        where profile_id = p_profile_id
          and system_role_id = v_admin_role_id;


        delete from public.admin_permission_grants
        where profile_id = p_profile_id;

    end if;


    insert into public.admin_access_logs (
        actor_profile_id,
        target_profile_id,
        action,
        details
    )
    values (
        auth.uid(),
        p_profile_id,
        case
            when p_enabled
                then 'ADMIN_ACCESS_GRANTED'
            else 'ADMIN_ACCESS_REVOKED'
        end,
        jsonb_build_object(
            'enabled',
            p_enabled
        )
    );

end;
$$;

revoke all
on function public.super_admin_set_admin_role(uuid, boolean)
from public;

grant execute
on function public.super_admin_set_admin_role(uuid, boolean)
to authenticated;


-- ============================================================
-- 9. REPLACE ADMIN PERMISSIONS
-- ============================================================

create or replace function
public.super_admin_set_admin_permissions(
    p_profile_id uuid,
    p_permission_codes text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_is_admin boolean;
begin

    if not public.is_super_admin() then
        raise exception 'FORBIDDEN'
            using errcode = '42501';
    end if;


    select exists (
        select 1
        from public.profile_system_roles psr
        join public.system_roles sr
          on sr.id = psr.system_role_id
        where psr.profile_id = p_profile_id
          and sr.code = 'admin'
    )
    into v_is_admin;


    if not v_is_admin then
        raise exception
            'Le profil cible ne possède pas le rôle Administrateur.';
    end if;


    delete from public.admin_permission_grants
    where profile_id = p_profile_id;


    insert into public.admin_permission_grants (
        profile_id,
        permission_id,
        granted_by
    )
    select
        p_profile_id,
        p.id,
        auth.uid()
    from public.permissions p
    where p.code = any(
        coalesce(
            p_permission_codes,
            array[]::text[]
        )
    )
    and p.code like 'admin.%';


    insert into public.admin_access_logs (
        actor_profile_id,
        target_profile_id,
        action,
        details
    )
    values (
        auth.uid(),
        p_profile_id,
        'ADMIN_PERMISSIONS_REPLACED',
        jsonb_build_object(
            'permissions',
            coalesce(
                to_jsonb(p_permission_codes),
                '[]'::jsonb
            )
        )
    );

end;
$$;

revoke all
on function public.super_admin_set_admin_permissions(uuid, text[])
from public;

grant execute
on function public.super_admin_set_admin_permissions(uuid, text[])
to authenticated;


-- ============================================================
-- 10. ADMIN ACCESS LOG EVENT
-- ============================================================

create or replace function
public.record_admin_access(
    p_action text,
    p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

    if not public.is_platform_admin() then
        raise exception 'FORBIDDEN'
            using errcode = '42501';
    end if;


    insert into public.admin_access_logs (
        actor_profile_id,
        action,
        details
    )
    values (
        auth.uid(),
        p_action,
        coalesce(
            p_details,
            '{}'::jsonb
        )
    );

end;
$$;

revoke all
on function public.record_admin_access(text, jsonb)
from public;

grant execute
on function public.record_admin_access(text, jsonb)
to authenticated;


-- ============================================================
-- 11. SUPER ADMIN ANALYTICS
-- NO MOCK DATA
-- ============================================================

create or replace function
public.super_admin_analytics_snapshot(
    p_from timestamptz default now() - interval '30 days',
    p_to timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare

    v_previous_from timestamptz;
    v_previous_to timestamptz;

    v_users_total bigint := 0;
    v_users_new bigint := 0;
    v_users_new_previous bigint := 0;
    v_verified_users bigint := 0;

    v_fighters_total bigint := 0;
    v_fighters_new bigint := 0;

    v_clubs_total bigint := 0;
    v_organizations_total bigint := 0;
    v_verified_organizations bigint := 0;

    v_events_total bigint := 0;
    v_events_period bigint := 0;
    v_events_previous bigint := 0;
    v_events_completed bigint := 0;
    v_events_cancelled bigint := 0;
    v_event_readiness numeric := 0;

    v_fights_total bigint := 0;
    v_fights_period bigint := 0;
    v_fights_completed bigint := 0;

    v_ticket_revenue numeric := 0;
    v_ticket_revenue_previous numeric := 0;
    v_tickets_sold bigint := 0;

    v_event_revenue numeric := 0;
    v_event_expenses numeric := 0;

    v_sponsor_value numeric := 0;

    v_subscription_value numeric := 0;
    v_active_subscriptions bigint := 0;

    v_messages_period bigint := 0;
    v_messages_previous bigint := 0;
    v_conversations_period bigint := 0;

    v_admins bigint := 0;

    v_database_size bigint := 0;
    v_database_connections bigint := 0;
    v_cache_hit_ratio numeric := null;

    v_role_breakdown jsonb := '[]'::jsonb;
    v_region_breakdown jsonb := '[]'::jsonb;
    v_discipline_breakdown jsonb := '[]'::jsonb;
    v_growth_series jsonb := '[]'::jsonb;

begin

    if not public.is_super_admin() then
        raise exception 'FORBIDDEN'
            using errcode = '42501';
    end if;


    if p_to <= p_from then
        raise exception
            'La date de fin doit être postérieure à la date de début.';
    end if;


    v_previous_to := p_from;
    v_previous_from :=
        p_from - (p_to - p_from);


    -- --------------------------------------------------------
    -- USERS
    -- --------------------------------------------------------

    select count(*)
    into v_users_total
    from public.profiles;


    select count(*)
    into v_users_new
    from public.profiles
    where created_at >= p_from
      and created_at < p_to;


    select count(*)
    into v_users_new_previous
    from public.profiles
    where created_at >= v_previous_from
      and created_at < v_previous_to;


    select count(*)
    into v_verified_users
    from public.profiles
    where is_verified = true;


    -- --------------------------------------------------------
    -- SPORT
    -- --------------------------------------------------------

    select count(*)
    into v_fighters_total
    from public.fighters;


    select count(*)
    into v_fighters_new
    from public.fighters
    where created_at >= p_from
      and created_at < p_to;


    select count(*)
    into v_clubs_total
    from public.clubs;


    select count(*)
    into v_organizations_total
    from public.organizations;


    select count(*)
    into v_verified_organizations
    from public.organizations
    where is_verified = true;


    select count(*)
    into v_events_total
    from public.events;


    select count(*)
    into v_events_period
    from public.events
    where created_at >= p_from
      and created_at < p_to;


    select count(*)
    into v_events_previous
    from public.events
    where created_at >= v_previous_from
      and created_at < v_previous_to;


    select count(*)
    into v_events_completed
    from public.events
    where created_at >= p_from
      and created_at < p_to
      and lower(coalesce(status, '')) in (
          'completed',
          'finished',
          'ended'
      );


    select count(*)
    into v_events_cancelled
    from public.events
    where created_at >= p_from
      and created_at < p_to
      and lower(coalesce(status, '')) in (
          'cancelled',
          'canceled'
      );


    select
        coalesce(
            avg(readiness_percent),
            0
        )
    into v_event_readiness
    from public.events
    where created_at >= p_from
      and created_at < p_to;


    select count(*)
    into v_fights_total
    from public.fights;


    select count(*)
    into v_fights_period
    from public.fights
    where created_at >= p_from
      and created_at < p_to;


    select count(*)
    into v_fights_completed
    from public.fights
    where created_at >= p_from
      and created_at < p_to
      and lower(coalesce(status, '')) in (
          'completed',
          'finished',
          'published'
      );


    -- --------------------------------------------------------
    -- TICKETING
    -- --------------------------------------------------------

    select
        coalesce(
            sum(total_amount),
            0
        )
    into v_ticket_revenue
    from public.ticket_sales
    where sold_at >= p_from
      and sold_at < p_to
      and lower(
          coalesce(
              payment_status,
              ''
          )
      ) in (
          'paid',
          'completed',
          'succeeded',
          'paye',
          'payé'
      );


    select
        coalesce(
            sum(total_amount),
            0
        )
    into v_ticket_revenue_previous
    from public.ticket_sales
    where sold_at >= v_previous_from
      and sold_at < v_previous_to
      and lower(
          coalesce(
              payment_status,
              ''
          )
      ) in (
          'paid',
          'completed',
          'succeeded',
          'paye',
          'payé'
      );


    select
        coalesce(
            sum(quantity),
            0
        )
    into v_tickets_sold
    from public.ticket_sales
    where sold_at >= p_from
      and sold_at < p_to;


    -- --------------------------------------------------------
    -- EVENT FINANCE
    -- --------------------------------------------------------

    select
        coalesce(
            sum(amount),
            0
        )
    into v_event_revenue
    from public.event_transactions
    where coalesce(
        occurred_at,
        created_at
    ) >= p_from

      and coalesce(
          occurred_at,
          created_at
      ) < p_to

      and lower(
          transaction_type
      ) in (
          'income',
          'revenue',
          'recette'
      )

      and lower(
          status
      ) in (
          'paid',
          'completed',
          'settled'
      );


    select
        coalesce(
            sum(amount),
            0
        )
    into v_event_expenses
    from public.event_transactions
    where coalesce(
        occurred_at,
        created_at
    ) >= p_from

      and coalesce(
          occurred_at,
          created_at
      ) < p_to

      and lower(
          transaction_type
      ) in (
          'expense',
          'depense',
          'dépense'
      )

      and lower(
          status
      ) in (
          'paid',
          'completed',
          'settled'
      );


    -- --------------------------------------------------------
    -- SPONSORING
    -- --------------------------------------------------------

    select
        coalesce(
            sum(amount),
            0
        )
    into v_sponsor_value
    from public.event_sponsors
    where created_at >= p_from
      and created_at < p_to;


    -- --------------------------------------------------------
    -- SUBSCRIPTIONS
    -- no date available in current schema:
    -- current snapshot only.
    -- --------------------------------------------------------

    select
        count(*),
        coalesce(
            sum(amount),
            0
        )
    into
        v_active_subscriptions,
        v_subscription_value
    from public.subscriptions
    where lower(
        coalesce(
            status,
            ''
        )
    ) in (
        'active',
        'paid',
        'current'
    );


    -- --------------------------------------------------------
    -- COMMUNICATION
    -- --------------------------------------------------------

    select count(*)
    into v_messages_period
    from public.messages
    where sent_at >= p_from
      and sent_at < p_to;


    select count(*)
    into v_messages_previous
    from public.messages
    where sent_at >= v_previous_from
      and sent_at < v_previous_to;


    select count(*)
    into v_conversations_period
    from public.conversations
    where created_at >= p_from
      and created_at < p_to;


    -- --------------------------------------------------------
    -- ADMINISTRATORS
    -- --------------------------------------------------------

    select count(*)
    into v_admins
    from public.profile_system_roles psr
    join public.system_roles sr
      on sr.id = psr.system_role_id
    where sr.code = 'admin';


    -- --------------------------------------------------------
    -- ROLE BREAKDOWN
    -- --------------------------------------------------------

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'slug',
                    q.slug,

                    'label',
                    q.label,

                    'value',
                    q.total
                )
                order by q.total desc
            ),
            '[]'::jsonb
        )
    into v_role_breakdown
    from (
        select
            r.slug,
            r.label,
            count(*) as total

        from public.profile_roles pr

        join public.roles r
          on r.id = pr.role_id

        group by
            r.slug,
            r.label
    ) q;


    -- --------------------------------------------------------
    -- REGION BREAKDOWN
    -- --------------------------------------------------------

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'regionId',
                    q.id,

                    'label',
                    q.name,

                    'value',
                    q.total
                )
                order by q.total desc
            ),
            '[]'::jsonb
        )
    into v_region_breakdown
    from (
        select
            r.id,
            r.name,
            count(p.id) as total

        from public.regions r

        left join public.profiles p
          on p.region_id = r.id

        where r.is_active = true

        group by
            r.id,
            r.name
    ) q;


    -- --------------------------------------------------------
    -- DISCIPLINE BREAKDOWN
    -- Based on real fights because fighters currently
    -- have no discipline_id column.
    -- --------------------------------------------------------

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'disciplineId',
                    q.id,

                    'label',
                    q.name,

                    'value',
                    q.total
                )
                order by q.total desc
            ),
            '[]'::jsonb
        )
    into v_discipline_breakdown
    from (
        select
            d.id,
            d.name,
            count(f.id) as total

        from public.disciplines d

        left join public.fights f
          on f.discipline_id = d.id

        where d.is_active is distinct from false

        group by
            d.id,
            d.name
    ) q;


    -- --------------------------------------------------------
    -- DAILY GROWTH SERIES
    -- --------------------------------------------------------

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'date',
                    to_char(
                        q.day_value,
                        'YYYY-MM-DD'
                    ),

                    'users',
                    q.users,

                    'fighters',
                    q.fighters,

                    'events',
                    q.events
                )
                order by q.day_value
            ),
            '[]'::jsonb
        )
    into v_growth_series
    from (
        select
            day_value,

            (
                select count(*)
                from public.profiles p
                where p.created_at >= day_value
                  and p.created_at < day_value + interval '1 day'
            ) as users,

            (
                select count(*)
                from public.fighters f
                where f.created_at >= day_value
                  and f.created_at < day_value + interval '1 day'
            ) as fighters,

            (
                select count(*)
                from public.events e
                where e.created_at >= day_value
                  and e.created_at < day_value + interval '1 day'
            ) as events

        from generate_series(
            date_trunc(
                'day',
                p_from
            ),

            date_trunc(
                'day',
                p_to
            ),

            interval '1 day'
        ) day_value
    ) q;


    -- --------------------------------------------------------
    -- DATABASE HEALTH
    -- --------------------------------------------------------

    select
        pg_database_size(
            current_database()
        )
    into v_database_size;


    select count(*)
    into v_database_connections
    from pg_stat_activity
    where datname =
        current_database();


    select
        round(
            (
                100.0 * blks_hit /
                nullif(
                    blks_hit + blks_read,
                    0
                )
            )::numeric,
            2
        )
    into v_cache_hit_ratio
    from pg_stat_database
    where datname =
        current_database();


    -- --------------------------------------------------------
    -- FINAL SNAPSHOT
    -- --------------------------------------------------------

    return jsonb_build_object(

        'period',
        jsonb_build_object(
            'from',
            p_from,

            'to',
            p_to,

            'previousFrom',
            v_previous_from,

            'previousTo',
            v_previous_to
        ),


        'overview',
        jsonb_build_object(

            'totalUsers',
            v_users_total,

            'newUsers',
            v_users_new,

            'newUsersGrowth',
            case
                when v_users_new_previous = 0
                    then null

                else round(
                    (
                        (
                            v_users_new -
                            v_users_new_previous
                        )::numeric
                        /
                        v_users_new_previous
                    ) * 100,
                    1
                )
            end,


            'verifiedUsers',
            v_verified_users,

            'verifiedUserRate',
            case
                when v_users_total = 0
                    then 0

                else round(
                    (
                        v_verified_users::numeric
                        /
                        v_users_total
                    ) * 100,
                    1
                )
            end,


            'fighters',
            v_fighters_total,

            'newFighters',
            v_fighters_new,


            'clubs',
            v_clubs_total,


            'organizations',
            v_organizations_total,

            'verifiedOrganizations',
            v_verified_organizations,


            'events',
            v_events_total,

            'newEvents',
            v_events_period,

            'newEventsGrowth',
            case
                when v_events_previous = 0
                    then null

                else round(
                    (
                        (
                            v_events_period -
                            v_events_previous
                        )::numeric
                        /
                        v_events_previous
                    ) * 100,
                    1
                )
            end,


            'fights',
            v_fights_total,


            'ticketRevenue',
            v_ticket_revenue,

            'ticketRevenueGrowth',
            case
                when v_ticket_revenue_previous = 0
                    then null

                else round(
                    (
                        (
                            v_ticket_revenue -
                            v_ticket_revenue_previous
                        )
                        /
                        v_ticket_revenue_previous
                    ) * 100,
                    1
                )
            end,


            'ticketsSold',
            v_tickets_sold,


            'messages',
            v_messages_period,

            'messagesGrowth',
            case
                when v_messages_previous = 0
                    then null

                else round(
                    (
                        (
                            v_messages_period -
                            v_messages_previous
                        )::numeric
                        /
                        v_messages_previous
                    ) * 100,
                    1
                )
            end
        ),


        'sport',
        jsonb_build_object(

            'eventsCreated',
            v_events_period,

            'eventsCompleted',
            v_events_completed,

            'eventsCancelled',
            v_events_cancelled,

            'averageReadiness',
            round(
                v_event_readiness,
                1
            ),

            'fightsCreated',
            v_fights_period,

            'fightsCompleted',
            v_fights_completed,

            'fightCompletionRate',
            case
                when v_fights_period = 0
                    then 0

                else round(
                    (
                        v_fights_completed::numeric
                        /
                        v_fights_period
                    ) * 100,
                    1
                )
            end
        ),


        'business',
        jsonb_build_object(

            'ticketRevenue',
            v_ticket_revenue,

            'ticketsSold',
            v_tickets_sold,

            'eventRevenue',
            v_event_revenue,

            'eventExpenses',
            v_event_expenses,

            'eventNet',
            v_event_revenue -
            v_event_expenses,

            'sponsoringValue',
            v_sponsor_value,

            'activeSubscriptions',
            v_active_subscriptions,

            'activeSubscriptionValue',
            v_subscription_value
        ),


        'community',
        jsonb_build_object(

            'messages',
            v_messages_period,

            'conversationsCreated',
            v_conversations_period,

            'socialPublishingAvailable',
            false
        ),


        'governance',
        jsonb_build_object(
            'administrators',
            v_admins
        ),


        'system',
        jsonb_build_object(

            'databaseSizeBytes',
            v_database_size,

            'databaseConnections',
            v_database_connections,

            'databaseCacheHitRate',
            v_cache_hit_ratio
        ),


        'breakdowns',
        jsonb_build_object(

            'roles',
            v_role_breakdown,

            'regions',
            v_region_breakdown,

            'disciplines',
            v_discipline_breakdown
        ),


        'growthSeries',
        v_growth_series
    );

end;
$$;


revoke all
on function public.super_admin_analytics_snapshot(
    timestamptz,
    timestamptz
)
from public;

grant execute
on function public.super_admin_analytics_snapshot(
    timestamptz,
    timestamptz
)
to authenticated;


commit;
