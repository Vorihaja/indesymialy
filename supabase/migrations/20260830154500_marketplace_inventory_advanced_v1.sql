begin;

-- ============================================================
-- INDESY BAZAR - STOCK ADVANCED V1
--
-- Authoritative stock:
--   marketplace_inventory.available
--   marketplace_inventory.reserved
--
-- Compatibility mirror:
--   products.stock
--
-- Reservations remain owned by order workflows.
-- ============================================================


-- ============================================================
-- PHYSICAL INVENTORY COUNTS
-- ============================================================

create table public.marketplace_inventory_counts (
    id uuid primary key default gen_random_uuid(),

    seller_organization_id uuid not null
        references public.organizations(id)
        on delete restrict,

    status text not null default 'draft'
        check (
            status in (
                'draft',
                'completed',
                'cancelled'
            )
        ),

    note text,

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    started_at timestamptz not null default now(),

    completed_at timestamptz,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


create unique index
marketplace_inventory_counts_one_draft_per_seller_idx
on public.marketplace_inventory_counts (
    seller_organization_id
)
where status = 'draft';


create index
marketplace_inventory_counts_seller_date_idx
on public.marketplace_inventory_counts (
    seller_organization_id,
    created_at desc
);


create table public.marketplace_inventory_count_lines (
    id uuid primary key default gen_random_uuid(),

    count_id uuid not null
        references public.marketplace_inventory_counts(id)
        on delete cascade,

    product_id uuid not null
        references public.products(id)
        on delete restrict,

    theoretical_available integer not null
        check (
            theoretical_available >= 0
        ),

    theoretical_reserved integer not null
        check (
            theoretical_reserved >= 0
        ),

    theoretical_physical integer not null
        check (
            theoretical_physical >= 0
        ),

    counted_physical integer
        check (
            counted_physical is null
            or counted_physical >= 0
        ),

    applied_delta integer not null default 0,

    counted_at timestamptz,

    created_at timestamptz not null default now(),

    unique (
        count_id,
        product_id
    )
);


create index
marketplace_inventory_count_lines_count_idx
on public.marketplace_inventory_count_lines (
    count_id
);


create index
marketplace_inventory_count_lines_product_idx
on public.marketplace_inventory_count_lines (
    product_id
);


-- ============================================================
-- SELLER AUTHORIZATION
-- ============================================================

create or replace function
public.marketplace_can_manage_seller_organization(
    p_seller_organization_id uuid
)
returns boolean

language sql
stable
security definer
set search_path = ''

as $function$

    select
        auth.uid() is not null

        and exists (
            select 1

            from public.organizations organization

            where
                organization.id =
                    p_seller_organization_id

                and organization.type =
                    'seller'

                and (
                    organization.owner_id =
                        auth.uid()

                    or exists (
                        select 1

                        from public.organization_members membership

                        where
                            membership.organization_id =
                                organization.id

                            and membership.profile_id =
                                auth.uid()

                            and membership.role in (
                                'owner',
                                'admin',
                                'manager',
                                'seller'
                            )

                            and coalesce(
                                membership.status,
                                'active'
                            ) =
                                'active'
                    )
                )
        );

$function$;


revoke all
on function
public.marketplace_can_manage_seller_organization(uuid)
from public, anon;


grant execute
on function
public.marketplace_can_manage_seller_organization(uuid)
to authenticated;


-- ============================================================
-- RLS
-- ============================================================

alter table
public.marketplace_inventory_counts
enable row level security;


alter table
public.marketplace_inventory_count_lines
enable row level security;


create policy
marketplace_inventory_counts_seller_read
on public.marketplace_inventory_counts
for select
to authenticated
using (
    public.marketplace_can_manage_seller_organization(
        seller_organization_id
    )
);


create policy
marketplace_inventory_count_lines_seller_read
on public.marketplace_inventory_count_lines
for select
to authenticated
using (
    exists (
        select 1

        from public.marketplace_inventory_counts inventory_count

        where
            inventory_count.id =
                count_id

            and public.marketplace_can_manage_seller_organization(
                inventory_count.seller_organization_id
            )
    )
);


grant select
on table
public.marketplace_inventory_counts
to authenticated;


grant select
on table
public.marketplace_inventory_count_lines
to authenticated;


revoke
    insert,
    update,
    delete
on table
public.marketplace_inventory_counts
from public, anon, authenticated;


revoke
    insert,
    update,
    delete
on table
public.marketplace_inventory_count_lines
from public, anon, authenticated;


-- ============================================================
-- LOW STOCK THRESHOLD
-- ============================================================

create or replace function
public.marketplace_set_low_stock_threshold(
    p_product_id uuid,
    p_seller_organization_id uuid,
    p_threshold integer
)
returns integer

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_threshold integer;

begin

    if not public.marketplace_can_manage_seller_organization(
        p_seller_organization_id
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'Seller organization access denied';

    end if;


    if (
        p_threshold is null
        or p_threshold < 0
    ) then

        raise exception
            using
                errcode = '22023',
                message =
                    'Low stock threshold must be zero or positive';

    end if;


    if not exists (
        select 1

        from public.products product

        where
            product.id =
                p_product_id

            and product.seller_id =
                p_seller_organization_id
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'Product does not belong to seller organization';

    end if;


    update public.marketplace_inventory

    set
        low_stock_threshold =
            p_threshold,

        updated_at =
            now()

    where
        product_id =
            p_product_id

    returning
        low_stock_threshold

    into
        v_threshold;


    if not found then

        raise exception
            using
                errcode = 'P0002',
                message =
                    'Inventory row not found';

    end if;


    return
        v_threshold;

end;

$function$;


-- ============================================================
-- ACTIVE STOCK RESERVATIONS
--
-- reserve increases reserved stock.
-- release cancels a reservation.
-- order-linked out consumes a reservation.
-- ============================================================

create or replace function
public.marketplace_list_inventory_reservations(
    p_seller_organization_id uuid
)
returns table (
    order_id uuid,
    product_id uuid,
    product_title text,
    quantity integer,
    order_status text,
    customer_name text,
    order_created_at timestamptz
)

language plpgsql
security definer
set search_path = ''

as $function$

begin

    if not public.marketplace_can_manage_seller_organization(
        p_seller_organization_id
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'Seller organization access denied';

    end if;


    return query

    select
        movement.order_id,

        movement.product_id,

        product.name,

        sum(
            case
                when movement.movement_type = 'reserve'
                    then movement.quantity

                when movement.movement_type in (
                    'release',
                    'out'
                )
                    then -movement.quantity

                else 0
            end
        )::integer as quantity,

        orders.status,

        orders.customer_name,

        orders.created_at

    from public.marketplace_stock_movements movement

    join public.products product
        on product.id =
            movement.product_id

    join public.marketplace_orders orders
        on orders.id =
            movement.order_id

    where
        product.seller_id =
            p_seller_organization_id

        and movement.order_id
            is not null

    group by
        movement.order_id,
        movement.product_id,
        product.name,
        orders.status,
        orders.customer_name,
        orders.created_at

    having
        sum(
            case
                when movement.movement_type = 'reserve'
                    then movement.quantity

                when movement.movement_type in (
                    'release',
                    'out'
                )
                    then -movement.quantity

                else 0
            end
        ) > 0

    order by
        orders.created_at desc;

end;

$function$;


-- ============================================================
-- START PHYSICAL INVENTORY
-- ============================================================

create or replace function
public.marketplace_start_inventory_count(
    p_seller_organization_id uuid,
    p_note text default null
)
returns uuid

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_count_id uuid;
    v_rows integer;

begin

    if not public.marketplace_can_manage_seller_organization(
        p_seller_organization_id
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'Seller organization access denied';

    end if;


    select
        inventory_count.id

    into
        v_count_id

    from public.marketplace_inventory_counts inventory_count

    where
        inventory_count.seller_organization_id =
            p_seller_organization_id

        and inventory_count.status =
            'draft'

    order by
        inventory_count.created_at desc

    limit 1;


    if v_count_id is not null then
        return v_count_id;
    end if;


    insert into public.marketplace_inventory_counts (
        seller_organization_id,
        status,
        note,
        created_by
    )

    values (
        p_seller_organization_id,
        'draft',

        nullif(
            btrim(
                coalesce(
                    p_note,
                    ''
                )
            ),
            ''
        ),

        auth.uid()
    )

    returning id
    into v_count_id;


    insert into public.marketplace_inventory_count_lines (
        count_id,
        product_id,
        theoretical_available,
        theoretical_reserved,
        theoretical_physical
    )

    select
        v_count_id,

        product.id,

        inventory.available,

        inventory.reserved,

        inventory.available +
            inventory.reserved

    from public.products product

    join public.marketplace_inventory inventory
        on inventory.product_id =
            product.id

    where
        product.seller_id =
            p_seller_organization_id;


    get diagnostics
        v_rows =
            row_count;


    if v_rows = 0 then

        delete from public.marketplace_inventory_counts
        where id =
            v_count_id;


        raise exception
            using
                errcode = '22023',
                message =
                    'No inventory products are available to count';

    end if;


    return
        v_count_id;

end;

$function$;


-- ============================================================
-- SAVE PHYSICAL COUNTS
--
-- p_counts example:
--
-- [
--   {
--     "productId": "uuid",
--     "countedPhysical": 12
--   }
-- ]
-- ============================================================

create or replace function
public.marketplace_save_inventory_count(
    p_count_id uuid,
    p_seller_organization_id uuid,
    p_counts jsonb
)
returns integer

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_status text;
    v_item jsonb;
    v_product_id uuid;
    v_counted integer;
    v_saved integer := 0;

begin

    if not public.marketplace_can_manage_seller_organization(
        p_seller_organization_id
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'Seller organization access denied';

    end if;


    select
        inventory_count.status

    into
        v_status

    from public.marketplace_inventory_counts inventory_count

    where
        inventory_count.id =
            p_count_id

        and inventory_count.seller_organization_id =
            p_seller_organization_id

    for update;


    if not found then

        raise exception
            using
                errcode = 'P0002',
                message =
                    'Inventory count not found';

    end if;


    if v_status <> 'draft' then

        raise exception
            using
                errcode = '55000',
                message =
                    'Inventory count is no longer editable';

    end if;


    if (
        p_counts is null
        or jsonb_typeof(
            p_counts
        ) <> 'array'
    ) then

        raise exception
            using
                errcode = '22023',
                message =
                    'Inventory counts payload must be an array';

    end if;


    for v_item in

        select value
        from jsonb_array_elements(
            p_counts
        )

    loop

        if not (
            v_item ? 'productId'
            and
            v_item ? 'countedPhysical'
        ) then

            raise exception
                using
                    errcode = '22023',
                    message =
                        'Invalid physical count payload';

        end if;


        v_product_id :=
            (v_item ->> 'productId')::uuid;


        v_counted :=
            (v_item ->> 'countedPhysical')::integer;


        if v_counted < 0 then

            raise exception
                using
                    errcode = '22023',
                    message =
                        'Counted physical stock cannot be negative';

        end if;


        update public.marketplace_inventory_count_lines

        set
            counted_physical =
                v_counted,

            counted_at =
                now()

        where
            count_id =
                p_count_id

            and product_id =
                v_product_id;


        if not found then

            raise exception
                using
                    errcode = 'P0002',
                    message =
                        'Product is not part of this inventory count';

        end if;


        v_saved :=
            v_saved + 1;

    end loop;


    update public.marketplace_inventory_counts

    set
        updated_at =
            now()

    where
        id =
            p_count_id;


    return
        v_saved;

end;

$function$;


-- ============================================================
-- FINALIZE PHYSICAL INVENTORY
--
-- Important:
-- - reserved is never edited manually.
-- - current inventory rows are locked.
-- - if an automatic/manual stock movement happened after the
--   count started, reconciliation is rejected.
-- - products.stock is synchronized by the existing trigger.
-- ============================================================

create or replace function
public.marketplace_finalize_inventory_count(
    p_count_id uuid,
    p_seller_organization_id uuid
)
returns uuid

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_status text;
    v_started_at timestamptz;

    v_line record;

    v_available integer;
    v_reserved integer;
    v_new_available integer;
    v_delta integer;

begin

    if not public.marketplace_can_manage_seller_organization(
        p_seller_organization_id
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'Seller organization access denied';

    end if;


    select
        inventory_count.status,
        inventory_count.started_at

    into
        v_status,
        v_started_at

    from public.marketplace_inventory_counts inventory_count

    where
        inventory_count.id =
            p_count_id

        and inventory_count.seller_organization_id =
            p_seller_organization_id

    for update;


    if not found then

        raise exception
            using
                errcode = 'P0002',
                message =
                    'Inventory count not found';

    end if;


    if v_status <> 'draft' then

        raise exception
            using
                errcode = '55000',
                message =
                    'Inventory count is no longer editable';

    end if;


    if exists (
        select 1

        from public.marketplace_inventory_count_lines line

        where
            line.count_id =
                p_count_id

            and line.counted_physical
                is null
    ) then

        raise exception
            using
                errcode = '22023',
                message =
                    'Every product must be counted before finalization';

    end if;


    for v_line in

        select
            line.id,
            line.product_id,
            line.counted_physical

        from public.marketplace_inventory_count_lines line

        where
            line.count_id =
                p_count_id

        order by
            line.product_id

    loop

        select
            inventory.available,
            inventory.reserved

        into
            v_available,
            v_reserved

        from public.marketplace_inventory inventory

        join public.products product
            on product.id =
                inventory.product_id

        where
            inventory.product_id =
                v_line.product_id

            and product.seller_id =
                p_seller_organization_id

        for update of inventory;


        if not found then

            raise exception
                using
                    errcode = 'P0002',
                    message =
                        'Inventory row disappeared during physical count';

        end if;


        if exists (
            select 1

            from public.marketplace_stock_movements movement

            where
                movement.product_id =
                    v_line.product_id

                and movement.created_at >
                    v_started_at
        ) then

            raise exception
                using
                    errcode = '40001',
                    message =
                        'Stock changed while physical inventory was in progress. Cancel and restart the inventory count.';

        end if;


        if
            v_line.counted_physical <
            v_reserved
        then

            raise exception
                using
                    errcode = '23514',
                    message =
                        'Counted physical stock cannot be lower than reserved stock';

        end if;


        v_new_available :=
            v_line.counted_physical -
            v_reserved;


        v_delta :=
            v_new_available -
            v_available;


        if v_delta <> 0 then

            update public.marketplace_inventory

            set
                available =
                    v_new_available,

                updated_at =
                    now()

            where
                product_id =
                    v_line.product_id;


            insert into public.marketplace_stock_movements (
                product_id,
                movement_type,
                quantity,
                reason,
                order_id,
                created_by
            )

            values (
                v_line.product_id,

                case
                    when v_delta > 0
                        then 'in'
                    else 'out'
                end,

                abs(
                    v_delta
                ),

                (
                    'Inventaire physique ' ||
                    p_count_id::text ||
                    ' - correction ' ||
                    case
                        when v_delta > 0
                            then '+'
                        else ''
                    end ||
                    v_delta::text
                ),

                null,

                auth.uid()
            );

        end if;


        update public.marketplace_inventory_count_lines

        set
            applied_delta =
                v_delta

        where
            id =
                v_line.id;

    end loop;


    update public.marketplace_inventory_counts

    set
        status =
            'completed',

        completed_at =
            now(),

        updated_at =
            now()

    where
        id =
            p_count_id;


    return
        p_count_id;

end;

$function$;


-- ============================================================
-- CANCEL PHYSICAL INVENTORY
-- ============================================================

create or replace function
public.marketplace_cancel_inventory_count(
    p_count_id uuid,
    p_seller_organization_id uuid
)
returns uuid

language plpgsql
security definer
set search_path = ''

as $function$

begin

    if not public.marketplace_can_manage_seller_organization(
        p_seller_organization_id
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'Seller organization access denied';

    end if;


    update public.marketplace_inventory_counts

    set
        status =
            'cancelled',

        updated_at =
            now()

    where
        id =
            p_count_id

        and seller_organization_id =
            p_seller_organization_id

        and status =
            'draft';


    if not found then

        raise exception
            using
                errcode = 'P0002',
                message =
                    'Editable inventory count not found';

    end if;


    return
        p_count_id;

end;

$function$;


-- ============================================================
-- RPC PRIVILEGES
-- ============================================================

revoke all
on function
public.marketplace_set_low_stock_threshold(
    uuid,
    uuid,
    integer
)
from public, anon;


revoke all
on function
public.marketplace_list_inventory_reservations(
    uuid
)
from public, anon;


revoke all
on function
public.marketplace_start_inventory_count(
    uuid,
    text
)
from public, anon;


revoke all
on function
public.marketplace_save_inventory_count(
    uuid,
    uuid,
    jsonb
)
from public, anon;


revoke all
on function
public.marketplace_finalize_inventory_count(
    uuid,
    uuid
)
from public, anon;


revoke all
on function
public.marketplace_cancel_inventory_count(
    uuid,
    uuid
)
from public, anon;


grant execute
on function
public.marketplace_set_low_stock_threshold(
    uuid,
    uuid,
    integer
)
to authenticated;


grant execute
on function
public.marketplace_list_inventory_reservations(
    uuid
)
to authenticated;


grant execute
on function
public.marketplace_start_inventory_count(
    uuid,
    text
)
to authenticated;


grant execute
on function
public.marketplace_save_inventory_count(
    uuid,
    uuid,
    jsonb
)
to authenticated;


grant execute
on function
public.marketplace_finalize_inventory_count(
    uuid,
    uuid
)
to authenticated;


grant execute
on function
public.marketplace_cancel_inventory_count(
    uuid,
    uuid
)
to authenticated;


comment on table
public.marketplace_inventory_counts
is
'Physical inventory sessions. marketplace_inventory remains authoritative.';


comment on table
public.marketplace_inventory_count_lines
is
'Physical count snapshots. Reserved order stock is never manually reconciled.';


commit;