begin;

-- ============================================================
-- Catalogue des permissions administrateur
-- ============================================================

create or replace function public.super_admin_list_permission_catalog()
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

    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'code', p.code,
                'description', p.description
            )
            order by p.code
        ),
        '[]'::jsonb
    )
    into result
    from public.permissions p
    where p.code like 'admin.%';

    return result;
end;
$$;

revoke all
on function public.super_admin_list_permission_catalog()
from public;

grant execute
on function public.super_admin_list_permission_catalog()
to authenticated;


-- ============================================================
-- Recherche de profils susceptibles de devenir Admin
-- ============================================================

create or replace function public.super_admin_search_profiles(
    p_query text default '',
    p_limit integer default 25
)
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

    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'profileId', q.profile_id,
                'fullName', q.full_name,
                'email', q.email,
                'status', q.status,
                'verified', q.is_verified,
                'isAdmin', q.is_admin,
                'isSuperAdmin', q.is_super_admin
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

            exists (
                select 1
                from public.profile_system_roles psr
                join public.system_roles sr
                  on sr.id = psr.system_role_id
                where psr.profile_id = p.id
                  and sr.code = 'admin'
            ) as is_admin,

            exists (
                select 1
                from public.profile_system_roles psr
                join public.system_roles sr
                  on sr.id = psr.system_role_id
                where psr.profile_id = p.id
                  and sr.code = 'super_admin'
            ) as is_super_admin

        from public.profiles p

        where
            coalesce(trim(p_query), '') = ''
            or p.full_name ilike '%' || trim(p_query) || '%'
            or p.email ilike '%' || trim(p_query) || '%'
            or p.username ilike '%' || trim(p_query) || '%'

        limit greatest(
            1,
            least(
                coalesce(p_limit, 25),
                100
            )
        )
    ) q;

    return result;
end;
$$;

revoke all
on function public.super_admin_search_profiles(text, integer)
from public;

grant execute
on function public.super_admin_search_profiles(text, integer)
to authenticated;


-- ============================================================
-- Journal des accès administrateurs
-- ============================================================

create or replace function public.super_admin_list_access_logs(
    p_limit integer default 100
)
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

    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id', q.id,
                'actorProfileId', q.actor_profile_id,
                'actorName', q.actor_name,
                'targetProfileId', q.target_profile_id,
                'targetName', q.target_name,
                'action', q.action,
                'details', q.details,
                'createdAt', q.created_at
            )
            order by q.created_at desc
        ),
        '[]'::jsonb
    )
    into result
    from (
        select
            l.id,
            l.actor_profile_id,
            actor.full_name as actor_name,
            l.target_profile_id,
            target.full_name as target_name,
            l.action,
            l.details,
            l.created_at
        from public.admin_access_logs l
        left join public.profiles actor
          on actor.id = l.actor_profile_id
        left join public.profiles target
          on target.id = l.target_profile_id
        order by l.created_at desc
        limit greatest(
            1,
            least(
                coalesce(p_limit, 100),
                500
            )
        )
    ) q;

    return result;
end;
$$;

revoke all
on function public.super_admin_list_access_logs(integer)
from public;

grant execute
on function public.super_admin_list_access_logs(integer)
to authenticated;


-- ============================================================
-- Renforcement : impossible de modifier un autre Super Admin
-- via les RPC de gestion Admin
-- ============================================================

create or replace function public.super_admin_set_admin_role(
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
    v_target_is_super_admin boolean;
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
          and sr.code = 'super_admin'
    )
    into v_target_is_super_admin;

    if v_target_is_super_admin then
        raise exception
            'Un compte Super Admin ne peut pas être administré depuis cette interface.';
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
            when p_enabled then 'ADMIN_ACCESS_GRANTED'
            else 'ADMIN_ACCESS_REVOKED'
        end,
        jsonb_build_object(
            'enabled',
            p_enabled
        )
    );

end;
$$;


create or replace function public.super_admin_set_admin_permissions(
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
    v_target_is_super_admin boolean;
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
          and sr.code = 'super_admin'
    )
    into v_target_is_super_admin;

    if v_target_is_super_admin then
        raise exception
            'Les permissions d''un Super Admin ne sont pas modifiables ici.';
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

commit;
