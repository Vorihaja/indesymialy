-- ============================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A8-HARDENING-H3
--
-- FINAL CHECKOUT CONCURRENCY HARDENING
--
-- Existing checkout already locks p/mp before inventory,
-- but its multi-product acquisition order is not explicit.
--
-- This migration pre-locks every product in deterministic
-- UUID order before invoking the original implementation.
--
-- No original PL/pgSQL business body is rewritten manually.
-- ============================================================


-- ============================================================
-- 1. CLONE THE CURRENT INSTALLED CHECKOUT
-- ============================================================

do $clone_checkout$
declare
    v_original_oid oid;
    v_impl_oid oid;

    v_original_definition text;
    v_impl_definition text;

    v_original_prosrc text;
    v_impl_prosrc text;

    v_original_prosecdef boolean;
    v_impl_prosecdef boolean;

    v_original_proretset boolean;
    v_impl_proretset boolean;

    v_original_prorettype oid;
    v_impl_prorettype oid;

    v_original_proargtypes oidvector;
    v_impl_proargtypes oidvector;

    v_original_proallargtypes oid[];
    v_impl_proallargtypes oid[];

    v_original_proargmodes "char"[];
    v_impl_proargmodes "char"[];

    v_original_proargnames text[];
    v_impl_proargnames text[];

    v_original_proconfig text[];
    v_impl_proconfig text[];

begin

    v_original_oid :=
        to_regprocedure(
            'public.marketplace_checkout(uuid,text,text,text,text,text,text,text)'
        );


    if v_original_oid is null then
        raise exception
            'marketplace_checkout is missing';
    end if;


    if to_regprocedure(
        'public.marketplace_checkout_impl(uuid,text,text,text,text,text,text,text)'
    ) is not null then
        raise exception
            'marketplace_checkout_impl already exists';
    end if;


    select
        p.prosrc,
        p.prosecdef,
        p.proretset,
        p.prorettype,
        p.proargtypes,
        p.proallargtypes,
        p.proargmodes,
        p.proargnames,
        p.proconfig
    into
        v_original_prosrc,
        v_original_prosecdef,
        v_original_proretset,
        v_original_prorettype,
        v_original_proargtypes,
        v_original_proallargtypes,
        v_original_proargmodes,
        v_original_proargnames,
        v_original_proconfig
    from pg_catalog.pg_proc as p
    where p.oid = v_original_oid;


    select pg_get_functiondef(
        v_original_oid
    )
    into v_original_definition;


    if v_original_definition is null then
        raise exception
            'Unable to read marketplace_checkout definition';
    end if;


    v_impl_definition :=
        regexp_replace(
            v_original_definition,
            'CREATE OR REPLACE FUNCTION[[:space:]]+public\."?marketplace_checkout"?\(',
            'CREATE OR REPLACE FUNCTION public.marketplace_checkout_impl(',
            'i'
        );


    if v_impl_definition = v_original_definition then
        raise exception
            'Unable to rename checkout implementation clone';
    end if;


    execute v_impl_definition;


    v_impl_oid :=
        to_regprocedure(
            'public.marketplace_checkout_impl(uuid,text,text,text,text,text,text,text)'
        );


    if v_impl_oid is null then
        raise exception
            'marketplace_checkout_impl was not created';
    end if;


    select
        p.prosrc,
        p.prosecdef,
        p.proretset,
        p.prorettype,
        p.proargtypes,
        p.proallargtypes,
        p.proargmodes,
        p.proargnames,
        p.proconfig
    into
        v_impl_prosrc,
        v_impl_prosecdef,
        v_impl_proretset,
        v_impl_prorettype,
        v_impl_proargtypes,
        v_impl_proallargtypes,
        v_impl_proargmodes,
        v_impl_proargnames,
        v_impl_proconfig
    from pg_catalog.pg_proc as p
    where p.oid = v_impl_oid;


    -- --------------------------------------------------------
    -- Exact preservation proof.
    -- --------------------------------------------------------

    if v_impl_prosrc is distinct from v_original_prosrc then
        raise exception
            'Checkout implementation prosrc differs from original';
    end if;


    if v_impl_prosecdef is distinct from v_original_prosecdef then
        raise exception
            'Checkout SECURITY DEFINER property differs';
    end if;


    if v_impl_proretset is distinct from v_original_proretset then
        raise exception
            'Checkout return-set property differs';
    end if;


    if v_impl_prorettype is distinct from v_original_prorettype then
        raise exception
            'Checkout return type differs';
    end if;


    if v_impl_proargtypes is distinct from v_original_proargtypes then
        raise exception
            'Checkout input argument types differ';
    end if;


    if v_impl_proallargtypes is distinct from v_original_proallargtypes then
        raise exception
            'Checkout all argument types differ';
    end if;


    if v_impl_proargmodes is distinct from v_original_proargmodes then
        raise exception
            'Checkout argument modes differ';
    end if;


    if v_impl_proargnames is distinct from v_original_proargnames then
        raise exception
            'Checkout argument names differ';
    end if;


    if v_impl_proconfig is distinct from v_original_proconfig then
        raise exception
            'Checkout function configuration differs';
    end if;

end;
$clone_checkout$;


-- ============================================================
-- 2. IMPLEMENTATION MUST BE INTERNAL
-- ============================================================

revoke all
on function public.marketplace_checkout_impl(
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text
)
from public;

revoke execute
on function public.marketplace_checkout_impl(
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text
)
from anon;

revoke execute
on function public.marketplace_checkout_impl(
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text
)
from authenticated;


-- ============================================================
-- 3. PUBLIC CHECKOUT WRAPPER
-- ============================================================

create or replace function public.marketplace_checkout(
    p_cart_id uuid,
    p_customer_name text,
    p_customer_email text,
    p_customer_phone text,
    p_fulfillment_method text,
    p_delivery_address text,
    p_payment_method text,
    p_idempotency_key text
)
returns table(order_id uuid)
language plpgsql
security definer
set search_path = ''
as $checkout_wrapper$
declare
    v_customer_id uuid := auth.uid();

    v_existing_group_id uuid;

    v_cart_locked boolean := false;

    v_product_id uuid;
begin

    -- --------------------------------------------------------
    -- Preserve idempotent replay semantics.
    --
    -- If checkout already exists for this user/key, we do NOT
    -- require the cart to still be active and do NOT perform
    -- unnecessary product locking.
    -- --------------------------------------------------------

    if v_customer_id is not null then

        select g.id
        into v_existing_group_id
        from public.marketplace_order_groups as g
        where g.customer_id = v_customer_id
          and g.idempotency_key = p_idempotency_key
        limit 1;

    end if;


    if v_existing_group_id is null
       and v_customer_id is not null then

        -- ----------------------------------------------------
        -- Preserve original CART-before-PRODUCT ordering.
        --
        -- Invalid/foreign/inactive carts are not used to lock
        -- arbitrary products. The original implementation will
        -- still produce its canonical validation error.
        -- ----------------------------------------------------

        perform 1
        from public.marketplace_carts as c
        where c.id = p_cart_id
          and c.customer_id = v_customer_id
          and c.status = 'active'
        for update;


        v_cart_locked := found;


        if v_cart_locked then

            -- ------------------------------------------------
            -- Canonical deterministic PRODUCT lock ordering.
            --
            -- Lock unique product UUIDs one by one in ascending
            -- UUID order.
            --
            -- The original checkout may lock them again later;
            -- PostgreSQL row locks are re-entrant for the same
            -- transaction.
            -- ------------------------------------------------

            for v_product_id in

                select distinct ci.product_id
                from public.marketplace_cart_items as ci
                where ci.cart_id = p_cart_id
                order by ci.product_id

            loop

                perform 1
                from public.products as p
                where p.id = v_product_id
                for update;

            end loop;

        end if;

    end if;


    -- --------------------------------------------------------
    -- Execute the exact original business implementation.
    -- --------------------------------------------------------

    return query
    select result.order_id
    from public.marketplace_checkout_impl(
        p_cart_id,
        p_customer_name,
        p_customer_email,
        p_customer_phone,
        p_fulfillment_method,
        p_delivery_address,
        p_payment_method,
        p_idempotency_key
    ) as result;

end;
$checkout_wrapper$;


-- ============================================================
-- 4. PRESERVE PUBLIC RPC AUTHORITY
-- ============================================================

revoke all
on function public.marketplace_checkout(
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text
)
from public;

revoke execute
on function public.marketplace_checkout(
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text
)
from anon;

grant execute
on function public.marketplace_checkout(
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text
)
to authenticated;


-- ============================================================
-- 5. STRUCTURAL CERTIFICATION
--
-- Inspect ONLY the small wrapper owned by H3.
-- ============================================================

do $certify_checkout_wrapper$
declare
    v_body text;
begin

    if to_regprocedure(
        'public.marketplace_checkout(uuid,text,text,text,text,text,text,text)'
    ) is null then
        raise exception
            'Public marketplace_checkout wrapper missing';
    end if;


    if to_regprocedure(
        'public.marketplace_checkout_impl(uuid,text,text,text,text,text,text,text)'
    ) is null then
        raise exception
            'marketplace_checkout_impl missing';
    end if;


    select regexp_replace(
        lower(p.prosrc),
        '[[:space:]]+',
        ' ',
        'g'
    )
    into v_body
    from pg_catalog.pg_proc as p
    where p.oid =
        'public.marketplace_checkout(uuid,text,text,text,text,text,text,text)'::regprocedure;


    if v_body is null then
        raise exception
            'Unable to inspect checkout wrapper';
    end if;


    if position(
        'marketplace_order_groups'
        in v_body
    ) <= 0 then
        raise exception
            'Checkout wrapper does not preserve idempotency preflight';
    end if;


    if position(
        'marketplace_carts'
        in v_body
    ) <= 0 then
        raise exception
            'Checkout wrapper does not lock active cart';
    end if;


    if position(
        'marketplace_cart_items'
        in v_body
    ) <= 0 then
        raise exception
            'Checkout wrapper does not enumerate cart products';
    end if;


    if position(
        'order by ci.product_id'
        in v_body
    ) <= 0 then
        raise exception
            'Checkout product lock ordering is not deterministic';
    end if;


    if position(
        'from public.products as p'
        in v_body
    ) <= 0 then
        raise exception
            'Checkout wrapper does not lock products';
    end if;


    if position(
        'for update'
        in v_body
    ) <= 0 then
        raise exception
            'Checkout wrapper contains no FOR UPDATE locks';
    end if;


    if position(
        'marketplace_checkout_impl'
        in v_body
    ) <= 0 then
        raise exception
            'Checkout wrapper does not delegate to original implementation';
    end if;


    if not has_function_privilege(
        'authenticated',
        'public.marketplace_checkout(uuid,text,text,text,text,text,text,text)',
        'EXECUTE'
    ) then
        raise exception
            'authenticated cannot execute public checkout';
    end if;


    if has_function_privilege(
        'anon',
        'public.marketplace_checkout(uuid,text,text,text,text,text,text,text)',
        'EXECUTE'
    ) then
        raise exception
            'anon can execute checkout unexpectedly';
    end if;


    if has_function_privilege(
        'authenticated',
        'public.marketplace_checkout_impl(uuid,text,text,text,text,text,text,text)',
        'EXECUTE'
    ) then
        raise exception
            'authenticated can execute checkout implementation directly';
    end if;

end;
$certify_checkout_wrapper$;


-- ============================================================
-- BAZAR-B1-A8-HARDENING-H3-COMPLETE
-- ============================================================