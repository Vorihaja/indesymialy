-- ============================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A8-HARDENING-H1-FINAL-R2
--
-- Definitive PRODUCT -> INVENTORY release hardening.
--
-- The installed A8 implementation is cloned by PostgreSQL.
--
-- No PowerShell PL/pgSQL body rewriting.
-- No FOR/LOOP manipulation.
-- No pretty-print-sensitive semantic validation.
-- ============================================================


-- ============================================================
-- 1. CLONE ORIGINAL IMPLEMENTATION
--
-- Most important guarantee:
--
--   original pg_proc.prosrc
--       ==
--   implementation clone pg_proc.prosrc
--
-- before public function replacement.
-- ============================================================

do $clone_and_verify_release$
declare
    v_original_oid oid;
    v_impl_oid oid;

    v_original_definition text;
    v_impl_definition text;

    v_original_prosrc text;
    v_impl_prosrc text;

    v_original_prosecdef boolean;
    v_impl_prosecdef boolean;

    v_original_provolatile "char";
    v_impl_provolatile "char";

    v_original_proparallel "char";
    v_impl_proparallel "char";

    v_original_proretset boolean;
    v_impl_proretset boolean;

    v_original_prorettype oid;
    v_impl_prorettype oid;

    v_original_proargtypes oidvector;
    v_impl_proargtypes oidvector;

    v_original_proconfig text[];
    v_impl_proconfig text[];

begin

    v_original_oid :=
        to_regprocedure(
            'public.marketplace_release_order_reservation(uuid,text)'
        );


    if v_original_oid is null then
        raise exception
            'Original marketplace_release_order_reservation(uuid,text) is missing';
    end if;


    if to_regprocedure(
        'public.marketplace_release_order_reservation_impl(uuid,text)'
    ) is not null then
        raise exception
            'Implementation clone already exists before H1-R2';
    end if;


    -- --------------------------------------------------------
    -- Capture original function catalog properties.
    -- --------------------------------------------------------

    select
        p.prosrc,
        p.prosecdef,
        p.provolatile,
        p.proparallel,
        p.proretset,
        p.prorettype,
        p.proargtypes,
        p.proconfig
    into
        v_original_prosrc,
        v_original_prosecdef,
        v_original_provolatile,
        v_original_proparallel,
        v_original_proretset,
        v_original_prorettype,
        v_original_proargtypes,
        v_original_proconfig
    from pg_catalog.pg_proc as p
    where p.oid = v_original_oid;


    if v_original_prosrc is null then
        raise exception
            'Unable to read original pg_proc.prosrc';
    end if;


    -- --------------------------------------------------------
    -- PostgreSQL generates the clone definition.
    -- --------------------------------------------------------

    select pg_get_functiondef(
        v_original_oid
    )
    into v_original_definition;


    if v_original_definition is null then
        raise exception
            'Unable to read original function definition';
    end if;


    v_impl_definition :=
        regexp_replace(
            v_original_definition,
            'CREATE OR REPLACE FUNCTION[[:space:]]+public\."?marketplace_release_order_reservation"?\(',
            'CREATE OR REPLACE FUNCTION public.marketplace_release_order_reservation_impl(',
            'i'
        );


    if v_impl_definition = v_original_definition then
        raise exception
            'Unable to rewrite function name for implementation clone';
    end if;


    execute v_impl_definition;


    v_impl_oid :=
        to_regprocedure(
            'public.marketplace_release_order_reservation_impl(uuid,text)'
        );


    if v_impl_oid is null then
        raise exception
            'Release implementation clone was not created';
    end if;


    -- --------------------------------------------------------
    -- Read clone properties.
    -- --------------------------------------------------------

    select
        p.prosrc,
        p.prosecdef,
        p.provolatile,
        p.proparallel,
        p.proretset,
        p.prorettype,
        p.proargtypes,
        p.proconfig
    into
        v_impl_prosrc,
        v_impl_prosecdef,
        v_impl_provolatile,
        v_impl_proparallel,
        v_impl_proretset,
        v_impl_prorettype,
        v_impl_proargtypes,
        v_impl_proconfig
    from pg_catalog.pg_proc as p
    where p.oid = v_impl_oid;


    -- --------------------------------------------------------
    -- Strong semantic preservation proof.
    --
    -- No whitespace matching.
    -- No pg_get_functiondef pretty-print matching.
    -- --------------------------------------------------------

    if v_impl_prosrc is distinct from v_original_prosrc then
        raise exception
            'Implementation clone prosrc differs from original';
    end if;


    if v_impl_prosecdef is distinct from v_original_prosecdef then
        raise exception
            'Implementation SECURITY DEFINER property differs';
    end if;


    if v_impl_provolatile is distinct from v_original_provolatile then
        raise exception
            'Implementation volatility differs';
    end if;


    if v_impl_proparallel is distinct from v_original_proparallel then
        raise exception
            'Implementation parallel property differs';
    end if;


    if v_impl_proretset is distinct from v_original_proretset then
        raise exception
            'Implementation SETOF property differs';
    end if;


    if v_impl_prorettype is distinct from v_original_prorettype then
        raise exception
            'Implementation return type differs';
    end if;


    if v_impl_proargtypes is distinct from v_original_proargtypes then
        raise exception
            'Implementation argument types differ';
    end if;


    if v_impl_proconfig is distinct from v_original_proconfig then
        raise exception
            'Implementation configuration differs';
    end if;

end;
$clone_and_verify_release$;


-- ============================================================
-- 2. IMPLEMENTATION CLONE MUST REMAIN INTERNAL
-- ============================================================

revoke all
on function public.marketplace_release_order_reservation_impl(uuid, text)
from public;

revoke execute
on function public.marketplace_release_order_reservation_impl(uuid, text)
from anon;

revoke execute
on function public.marketplace_release_order_reservation_impl(uuid, text)
from authenticated;


-- ============================================================
-- 3. REPLACE PUBLIC FUNCTION WITH SMALL WRAPPER
--
-- Existing public function name/signature/OID is preserved by
-- CREATE OR REPLACE.
--
-- The wrapper acquires PRODUCT locks deterministically.
--
-- The unchanged implementation subsequently acquires the
-- INVENTORY locks.
--
-- Final order:
--
--      PRODUCT -> INVENTORY
-- ============================================================

create or replace function public.marketplace_release_order_reservation(
    p_order_id uuid,
    p_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $release_wrapper$
declare
    v_released integer;
begin

    -- --------------------------------------------------------
    -- PRODUCT locks first.
    --
    -- Unique products only.
    -- Deterministic UUID ordering.
    -- --------------------------------------------------------

    perform p.id
    from public.products as p
    where exists (
        select 1
        from public.marketplace_order_lines as ol
        where ol.order_id = p_order_id
          and ol.product_id = p.id
    )
    order by p.id
    for update;


    -- --------------------------------------------------------
    -- Original A8 implementation.
    --
    -- This clone is already proven identical via pg_proc.prosrc.
    -- --------------------------------------------------------

    v_released :=
        public.marketplace_release_order_reservation_impl(
            p_order_id,
            p_reason
        );


    return v_released;

end;
$release_wrapper$;


-- ============================================================
-- 4. AUTHORITY BOUNDARY
-- ============================================================

revoke all
on function public.marketplace_release_order_reservation(uuid, text)
from public;

revoke execute
on function public.marketplace_release_order_reservation(uuid, text)
from anon;

revoke execute
on function public.marketplace_release_order_reservation(uuid, text)
from authenticated;

grant execute
on function public.marketplace_release_order_reservation(uuid, text)
to service_role;


-- ============================================================
-- 5. FINAL WRAPPER STRUCTURAL CERTIFICATION
--
-- We inspect ONLY the small wrapper that this migration owns.
--
-- We do NOT inspect/reinterpret the original business body.
-- ============================================================

do $certify_wrapper$
declare
    v_wrapper_body text;
begin

    if to_regprocedure(
        'public.marketplace_release_order_reservation(uuid,text)'
    ) is null then
        raise exception
            'Release wrapper is missing';
    end if;


    if to_regprocedure(
        'public.marketplace_release_order_reservation_impl(uuid,text)'
    ) is null then
        raise exception
            'Release implementation clone is missing';
    end if;


    select regexp_replace(
        lower(p.prosrc),
        '[[:space:]]+',
        ' ',
        'g'
    )
    into v_wrapper_body
    from pg_catalog.pg_proc as p
    where p.oid =
        'public.marketplace_release_order_reservation(uuid,text)'::regprocedure;


    if v_wrapper_body is null then
        raise exception
            'Unable to read release wrapper body';
    end if;


    if position(
        'from public.products as p'
        in v_wrapper_body
    ) <= 0 then
        raise exception
            'Release wrapper does not access products first';
    end if;


    if position(
        'order by p.id'
        in v_wrapper_body
    ) <= 0 then
        raise exception
            'Release wrapper product locks are not deterministic';
    end if;


    if position(
        'for update'
        in v_wrapper_body
    ) <= 0 then
        raise exception
            'Release wrapper does not lock products FOR UPDATE';
    end if;


    if position(
        'marketplace_release_order_reservation_impl'
        in v_wrapper_body
    ) <= 0 then
        raise exception
            'Release wrapper does not delegate to implementation';
    end if;


    -- --------------------------------------------------------
    -- Public access boundaries.
    -- --------------------------------------------------------

    if has_function_privilege(
        'authenticated',
        'public.marketplace_release_order_reservation(uuid,text)',
        'EXECUTE'
    ) then
        raise exception
            'authenticated can execute release wrapper directly';
    end if;


    if has_function_privilege(
        'anon',
        'public.marketplace_release_order_reservation(uuid,text)',
        'EXECUTE'
    ) then
        raise exception
            'anon can execute release wrapper directly';
    end if;


    if not has_function_privilege(
        'service_role',
        'public.marketplace_release_order_reservation(uuid,text)',
        'EXECUTE'
    ) then
        raise exception
            'service_role cannot execute release wrapper';
    end if;


    if has_function_privilege(
        'authenticated',
        'public.marketplace_release_order_reservation_impl(uuid,text)',
        'EXECUTE'
    ) then
        raise exception
            'authenticated can execute release implementation directly';
    end if;

end;
$certify_wrapper$;


-- ============================================================
-- BAZAR-B1-A8-HARDENING-H1-FINAL-R2-COMPLETE
-- ============================================================