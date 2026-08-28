begin;

-- ============================================================
-- INDESY MIALY
-- Réparation du contexte Auth pour comptes système
-- ============================================================


-- ============================================================
-- 1. FINALISER LE PROFIL SUPER ADMIN SI NECESSAIRE
-- ============================================================

do $$
declare

    v_user_id uuid :=
        '5a23123d-5c94-4df6-a065-df3d153ee4c5'::uuid;

    v_super_admin_role_id uuid;

begin

    if not exists (
        select 1
        from auth.users u
        where u.id = v_user_id
          and lower(u.email) =
              lower('jayaherve@proton.me')
    ) then

        raise exception
            'Compte Supabase Auth introuvable : %',
            'jayaherve@proton.me';

    end if;


    -- --------------------------------------------------------
    -- Création du profil seulement s'il est absent.
    -- Aucun is_verified=true.
    -- --------------------------------------------------------

    if not exists (
        select 1
        from public.profiles p
        where p.id = v_user_id
    ) then

        perform set_config(
            'request.jwt.claim.sub',
            v_user_id::text,
            true
        );

        perform set_config(
            'request.jwt.claim.role',
            'authenticated',
            true
        );

        insert into public.profiles (
            id,
            email,
            full_name,
            username,
            status,
            primary_role_id,
            region_id,
            city_id
        )
        values (
            v_user_id,
            'jayaherve@proton.me',
            'Super Administrateur Indesy',
            'vh-teck-super-admin',
            'active',
            null,
            null,
            null
        );

    end if;


    if not exists (
        select 1
        from public.profiles
        where id = v_user_id
    ) then

        raise exception
            'Profil applicatif Super Admin introuvable.';

    end if;


    -- --------------------------------------------------------
    -- Aucun rôle métier
    -- --------------------------------------------------------

    delete from public.profile_roles
    where profile_id = v_user_id;


    -- --------------------------------------------------------
    -- Rôle système super_admin
    -- --------------------------------------------------------

    select sr.id
    into v_super_admin_role_id
    from public.system_roles sr
    where sr.code = 'super_admin'
    limit 1;


    if v_super_admin_role_id is null then

        insert into public.system_roles (
            code,
            label,
            description
        )
        values (
            'super_admin',
            'Super Administrateur',
            'Pilotage exécutif et gouvernance des administrateurs'
        )
        returning id
        into v_super_admin_role_id;

    end if;


    -- Retirer tout autre rôle système.

    delete from public.profile_system_roles psr

    using public.system_roles sr

    where psr.profile_id = v_user_id
      and psr.system_role_id = sr.id
      and sr.code <> 'super_admin';


    -- Ajouter super_admin.

    insert into public.profile_system_roles (
        profile_id,
        system_role_id
    )
    select
        v_user_id,
        v_super_admin_role_id

    where not exists (
        select 1
        from public.profile_system_roles psr
        where psr.profile_id = v_user_id
          and psr.system_role_id =
              v_super_admin_role_id
    );


    -- Pas de permissions Admin opérationnelles.

    delete from public.admin_permission_grants
    where profile_id = v_user_id;


    if not exists (
        select 1
        from public.profile_system_roles psr
        join public.system_roles sr
          on sr.id = psr.system_role_id
        where psr.profile_id = v_user_id
          and sr.code = 'super_admin'
    ) then

        raise exception
            'Attribution super_admin non confirmée.';

    end if;

end
$$;


-- ============================================================
-- 2. CONTEXTE AUTH CANONIQUE
--
-- Compatible avec :
-- - utilisateur avec rôle métier
-- - utilisateur multi-rôles
-- - Admin
-- - Super Admin sans aucun rôle métier
-- ============================================================

create or replace function
public.get_my_auth_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$

declare

    v_uid uuid;

    v_profile jsonb;

    v_primary_role text;

    v_roles jsonb;

    v_system_roles jsonb;

    v_permissions jsonb;

begin

    v_uid := auth.uid();


    -- --------------------------------------------------------
    -- Pas de session
    -- --------------------------------------------------------

    if v_uid is null then

        return jsonb_build_object(

            'profile',
            null,

            'primaryRole',
            null,

            'roles',
            '[]'::jsonb,

            'systemRoles',
            '[]'::jsonb,

            'permissions',
            '[]'::jsonb

        );

    end if;


    -- --------------------------------------------------------
    -- Profil
    -- --------------------------------------------------------

    select
        jsonb_build_object(

            'id',
            p.id,

            'fullName',
            p.full_name,

            'email',
            p.email,

            'status',
            coalesce(
                p.status,
                'active'
            )

        )
    into v_profile

    from public.profiles p

    where p.id = v_uid;


    -- --------------------------------------------------------
    -- Rôle métier principal
    -- Peut être NULL pour les comptes système.
    -- --------------------------------------------------------

    select r.slug

    into v_primary_role

    from public.profiles p

    left join public.roles r
      on r.id =
         p.primary_role_id

    where p.id =
          v_uid;


    -- --------------------------------------------------------
    -- Rôles métier
    --
    -- Inclut :
    -- profile_roles
    -- +
    -- primary_role_id s'il existe.
    -- --------------------------------------------------------

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(

                    'id',
                    q.id,

                    'slug',
                    q.slug,

                    'label',
                    q.label,

                    'description',
                    q.description,

                    'is_organization',
                    q.is_organization,

                    'created_at',
                    q.created_at

                )
                order by q.label
            ),
            '[]'::jsonb
        )

    into v_roles

    from (

        select distinct
            r.id,
            r.slug,
            r.label,
            r.description,
            coalesce(
                r.is_organization,
                false
            ) as is_organization,
            r.created_at

        from public.roles r

        where r.id in (

            select pr.role_id

            from public.profile_roles pr

            where pr.profile_id =
                  v_uid

              and pr.role_id
                  is not null

            union

            select p.primary_role_id

            from public.profiles p

            where p.id =
                  v_uid

              and p.primary_role_id
                  is not null

        )

    ) q;


    -- --------------------------------------------------------
    -- Rôles système
    -- --------------------------------------------------------

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(

                    'id',
                    sr.id,

                    'code',
                    sr.code,

                    'label',
                    sr.label,

                    'description',
                    sr.description,

                    'created_at',
                    sr.created_at

                )
                order by sr.code
            ),
            '[]'::jsonb
        )

    into v_system_roles

    from public.profile_system_roles psr

    join public.system_roles sr
      on sr.id =
         psr.system_role_id

    where psr.profile_id =
          v_uid;


    -- --------------------------------------------------------
    -- Permissions
    --
    -- 1. permissions provenant des rôles métier
    -- 2. permissions individuelles des Admins
    --
    -- Super Admin ne reçoit PAS automatiquement
    -- les droits opérationnels Admin.
    -- --------------------------------------------------------

    select
        coalesce(
            jsonb_agg(
                jsonb_build_object(

                    'id',
                    q.id,

                    'code',
                    q.code,

                    'description',
                    q.description

                )
                order by q.code
            ),
            '[]'::jsonb
        )

    into v_permissions

    from (

        select distinct
            p.id,
            p.code,
            p.description

        from public.permissions p

        join public.role_permissions rp
          on rp.permission_id =
             p.id

        join public.profile_roles pr
          on pr.role_id =
             rp.role_id

        where pr.profile_id =
              v_uid


        union


        select distinct
            p.id,
            p.code,
            p.description

        from public.permissions p

        join public.admin_permission_grants apg
          on apg.permission_id =
             p.id

        where apg.profile_id =
              v_uid

    ) q;


    -- --------------------------------------------------------
    -- Résultat
    -- --------------------------------------------------------

    return jsonb_build_object(

        'profile',
        v_profile,

        'primaryRole',
        v_primary_role,

        'roles',
        coalesce(
            v_roles,
            '[]'::jsonb
        ),

        'systemRoles',
        coalesce(
            v_system_roles,
            '[]'::jsonb
        ),

        'permissions',
        coalesce(
            v_permissions,
            '[]'::jsonb
        )

    );

end;

$function$;


revoke all
on function public.get_my_auth_context()
from public;


grant execute
on function public.get_my_auth_context()
to authenticated;


-- ============================================================
-- 3. HELPER PLATFORM ADMIN CANONIQUE
-- ============================================================

create or replace function
public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $function$

    select exists (

        select 1

        from public.profile_system_roles psr

        join public.system_roles sr
          on sr.id =
             psr.system_role_id

        where psr.profile_id =
              auth.uid()

          and sr.code in (
              'admin',
              'super_admin'
          )

    );

$function$;


revoke all
on function public.is_platform_admin()
from public;


grant execute
on function public.is_platform_admin()
to authenticated;


commit;
