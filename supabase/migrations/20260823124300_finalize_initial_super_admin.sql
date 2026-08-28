begin;

-- ============================================================
-- INDESY MIALY
-- Bootstrap initial du compte SUPER ADMIN
--
-- Le compte Auth existe déjà.
-- Le profil système :
-- - n'est PAS auto-vérifié
-- - n'a AUCUN rôle métier
-- - possède uniquement super_admin
-- ============================================================

do $$
declare

    v_user_id uuid :=
        '5a23123d-5c94-4df6-a065-df3d153ee4c5'::uuid;

    v_super_admin_role_id uuid;

begin

    -- ========================================================
    -- 1. Vérifier le compte Supabase Auth
    -- ========================================================

    if not exists (
        select 1
        from auth.users u
        where u.id = v_user_id
          and lower(u.email) = lower('jayaherve@proton.me')
    ) then

        raise exception
            'Compte Auth introuvable : % / %',
            v_user_id,
            'jayaherve@proton.me';

    end if;


    -- ========================================================
    -- 2. Créer le profil UNIQUEMENT s'il n'existe pas
    --
    -- IMPORTANT :
    -- is_verified est volontairement omis.
    -- Il conserve donc sa valeur par défaut.
    -- ========================================================

    if not exists (
        select 1
        from public.profiles p
        where p.id = v_user_id
    ) then

        -- Le trigger de sécurité considère cette opération
        -- comme réalisée par le propriétaire du profil.

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


        raise notice
            'Profil système créé : %',
            v_user_id;

    else

        raise notice
            'Profil déjà existant : %. Aucun UPDATE nécessaire.',
            v_user_id;

    end if;


    -- ========================================================
    -- 3. Vérifier que le profil existe
    -- ========================================================

    if not exists (
        select 1
        from public.profiles p
        where p.id = v_user_id
    ) then

        raise exception
            'Impossible de créer le profil applicatif.';

    end if;


    -- ========================================================
    -- 4. RETIRER LES ROLES METIER
    -- ========================================================

    delete from public.profile_roles
    where profile_id = v_user_id;


    -- ========================================================
    -- 5. Récupérer / créer super_admin
    -- ========================================================

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


    -- ========================================================
    -- 6. SUPPRIMER LES AUTRES ROLES SYSTEME
    -- ========================================================

    delete from public.profile_system_roles psr

    using public.system_roles sr

    where psr.profile_id = v_user_id
      and psr.system_role_id = sr.id
      and sr.code <> 'super_admin';


    -- ========================================================
    -- 7. ATTRIBUER SUPER_ADMIN
    -- ========================================================

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


    -- ========================================================
    -- 8. PAS DE PERMISSIONS ADMIN OPERATIONNELLES
    -- ========================================================

    delete from public.admin_permission_grants
    where profile_id = v_user_id;


    -- ========================================================
    -- 9. CONTROLES
    -- ========================================================

    if exists (
        select 1
        from public.profile_roles pr
        where pr.profile_id = v_user_id
    ) then

        raise exception
            'Le compte possède encore un rôle métier.';

    end if;


    if not exists (
        select 1

        from public.profile_system_roles psr

        join public.system_roles sr
          on sr.id = psr.system_role_id

        where psr.profile_id = v_user_id
          and sr.code = 'super_admin'
    ) then

        raise exception
            'Le rôle super_admin n''a pas été attribué.';

    end if;


    if exists (
        select 1

        from public.profile_system_roles psr

        join public.system_roles sr
          on sr.id = psr.system_role_id

        where psr.profile_id = v_user_id
          and sr.code <> 'super_admin'
    ) then

        raise exception
            'Le compte possède un autre rôle système.';

    end if;


    raise notice
        'SUPER ADMIN FINALISE : % / %',
        v_user_id,
        'jayaherve@proton.me';

end
$$;

commit;
