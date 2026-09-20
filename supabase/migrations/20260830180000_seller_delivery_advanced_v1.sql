begin;


-- ============================================================
-- SELLER DELIVERY ADVANCED V1
--
-- Existing authorities preserved:
--
-- marketplace_orders          commercial workflow
-- marketplace_deliveries      shipment instance
-- marketplace_inventory       stock authority
-- marketplace_payments        payment authority
-- financial_entries           accounting authority
--
-- No checkout fee integration.
-- No automatic refund.
-- No automatic restock.
-- ============================================================


-- ============================================================
-- CARRIERS
-- ============================================================

create table public.marketplace_delivery_carriers (
    id uuid primary key
        default gen_random_uuid(),

    seller_organization_id uuid not null
        references public.organizations(id)
        on delete restrict,

    name text not null,

    phone text,

    email text,

    website text,

    tracking_url_template text,

    notes text,

    status text not null
        default 'active'
        check (
            status in (
                'active',
                'inactive',
                'archived'
            )
        ),

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint marketplace_delivery_carriers_name_check
        check (
            length(
                btrim(name)
            ) > 0
        )
);


create unique index
marketplace_delivery_carriers_name_uidx
on public.marketplace_delivery_carriers (
    seller_organization_id,
    lower(
        btrim(name)
    )
)
where status <> 'archived';


create index
marketplace_delivery_carriers_seller_status_idx
on public.marketplace_delivery_carriers (
    seller_organization_id,
    status,
    created_at desc
);


alter table public.marketplace_deliveries
add column carrier_id uuid
references public.marketplace_delivery_carriers(id)
on delete set null;


create index
marketplace_deliveries_carrier_idx
on public.marketplace_deliveries (
    carrier_id
);


-- Keep compatibility with the existing free-text carrier field.
--
-- If old DeliveryFeature changes carrier text manually while carrier_id
-- points to a different registered carrier, carrier_id is cleared.
--
-- Structured assignment writes both fields with matching values.

create or replace function
public.marketplace_guard_delivery_carrier_reference()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
    v_name text;
begin
    if new.carrier_id is null then
        return new;
    end if;

    select
        c.name
    into
        v_name
    from
        public.marketplace_delivery_carriers c
    where
        c.id = new.carrier_id;

    if not found then
        new.carrier_id := null;
        return new;
    end if;

    if new.carrier is distinct from v_name then
        new.carrier_id := null;
    end if;

    return new;
end;
$$;


create trigger
marketplace_deliveries_carrier_reference_guard
before update of carrier, carrier_id
on public.marketplace_deliveries
for each row
execute function
public.marketplace_guard_delivery_carrier_reference();


-- ============================================================
-- DELIVERY ZONES
-- ============================================================

create table public.marketplace_delivery_zones (
    id uuid primary key
        default gen_random_uuid(),

    seller_organization_id uuid not null
        references public.organizations(id)
        on delete restrict,

    name text not null,

    delivery_fee numeric(14,2) not null
        default 0
        check (
            delivery_fee >= 0
        ),

    currency char(3) not null
        default 'MGA',

    min_delivery_days integer not null
        default 1
        check (
            min_delivery_days >= 0
        ),

    max_delivery_days integer not null
        default 1,

    free_delivery_threshold numeric(14,2),

    status text not null
        default 'active'
        check (
            status in (
                'active',
                'inactive',
                'archived'
            )
        ),

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint marketplace_delivery_zones_name_check
        check (
            length(
                btrim(name)
            ) > 0
        ),

    constraint marketplace_delivery_zones_delay_check
        check (
            max_delivery_days >=
            min_delivery_days
        ),

    constraint marketplace_delivery_zones_free_threshold_check
        check (
            free_delivery_threshold is null
            or free_delivery_threshold >= 0
        )
);


create unique index
marketplace_delivery_zones_name_uidx
on public.marketplace_delivery_zones (
    seller_organization_id,
    lower(
        btrim(name)
    )
)
where status <> 'archived';


create index
marketplace_delivery_zones_seller_status_idx
on public.marketplace_delivery_zones (
    seller_organization_id,
    status,
    created_at desc
);


create table public.marketplace_delivery_zone_areas (
    id uuid primary key
        default gen_random_uuid(),

    zone_id uuid not null
        references public.marketplace_delivery_zones(id)
        on delete cascade,

    region_id uuid
        references public.regions(id)
        on delete restrict,

    district_id uuid
        references public.districts(id)
        on delete restrict,

    city_id uuid
        references public.cities(id)
        on delete restrict,

    commune_id uuid
        references public.communes(id)
        on delete restrict,

    created_at timestamptz not null
        default now(),

    constraint marketplace_delivery_zone_areas_scope_check
        check (
            region_id is not null
            or district_id is not null
            or city_id is not null
            or commune_id is not null
        )
);


create index
marketplace_delivery_zone_areas_zone_idx
on public.marketplace_delivery_zone_areas (
    zone_id
);


-- ============================================================
-- RETURNS
-- ============================================================

create table public.marketplace_returns (
    id uuid primary key
        default gen_random_uuid(),

    seller_organization_id uuid not null
        references public.organizations(id)
        on delete restrict,

    order_id uuid not null
        references public.marketplace_orders(id)
        on delete restrict,

    customer_id uuid not null
        references public.profiles(id)
        on delete restrict,

    reason text not null,

    status text not null
        default 'requested'
        check (
            status in (
                'requested',
                'approved',
                'rejected',
                'received',
                'resolved',
                'cancelled'
            )
        ),

    resolution text
        check (
            resolution is null
            or resolution in (
                'refund',
                'exchange',
                'store_credit',
                'none'
            )
        ),

    requested_at timestamptz not null
        default now(),

    received_at timestamptz,

    resolved_at timestamptz,

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    updated_at timestamptz not null
        default now(),

    constraint marketplace_returns_reason_check
        check (
            length(
                btrim(reason)
            ) > 0
        )
);


create index
marketplace_returns_seller_status_idx
on public.marketplace_returns (
    seller_organization_id,
    status,
    requested_at desc
);


create index
marketplace_returns_order_idx
on public.marketplace_returns (
    order_id,
    requested_at desc
);


create table public.marketplace_return_items (
    id uuid primary key
        default gen_random_uuid(),

    return_id uuid not null
        references public.marketplace_returns(id)
        on delete cascade,

    order_line_id uuid not null
        references public.marketplace_order_lines(id)
        on delete restrict,

    quantity integer not null
        check (
            quantity > 0
        ),

    condition text not null
        default 'good'
        check (
            condition in (
                'unopened',
                'good',
                'damaged',
                'defective',
                'other'
            )
        ),

    note text,

    created_at timestamptz not null
        default now(),

    unique (
        return_id,
        order_line_id
    )
);


create index
marketplace_return_items_line_idx
on public.marketplace_return_items (
    order_line_id
);


create table public.marketplace_return_status_history (
    id uuid primary key
        default gen_random_uuid(),

    return_id uuid not null
        references public.marketplace_returns(id)
        on delete cascade,

    from_status text,

    to_status text not null,

    note text,

    changed_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null
        default now()
);


create index
marketplace_return_history_return_date_idx
on public.marketplace_return_status_history (
    return_id,
    created_at
);


-- ============================================================
-- RLS
-- ============================================================

alter table
public.marketplace_delivery_carriers
enable row level security;

alter table
public.marketplace_delivery_zones
enable row level security;

alter table
public.marketplace_delivery_zone_areas
enable row level security;

alter table
public.marketplace_returns
enable row level security;

alter table
public.marketplace_return_items
enable row level security;

alter table
public.marketplace_return_status_history
enable row level security;


create policy
marketplace_delivery_carriers_seller_read
on public.marketplace_delivery_carriers
for select
to authenticated
using (
    public.marketplace_can_manage_seller_organization(
        seller_organization_id
    )
);


create policy
marketplace_delivery_zones_seller_read
on public.marketplace_delivery_zones
for select
to authenticated
using (
    public.marketplace_can_manage_seller_organization(
        seller_organization_id
    )
);


create policy
marketplace_delivery_zone_areas_seller_read
on public.marketplace_delivery_zone_areas
for select
to authenticated
using (
    exists (
        select 1
        from public.marketplace_delivery_zones z
        where
            z.id =
            marketplace_delivery_zone_areas.zone_id

            and

            public.marketplace_can_manage_seller_organization(
                z.seller_organization_id
            )
    )
);


create policy
marketplace_returns_parties_read
on public.marketplace_returns
for select
to authenticated
using (
    customer_id =
        auth.uid()

    or

    public.marketplace_can_manage_seller_organization(
        seller_organization_id
    )
);


create policy
marketplace_return_items_parties_read
on public.marketplace_return_items
for select
to authenticated
using (
    exists (
        select 1
        from public.marketplace_returns r
        where
            r.id =
            marketplace_return_items.return_id

            and (
                r.customer_id =
                    auth.uid()

                or

                public.marketplace_can_manage_seller_organization(
                    r.seller_organization_id
                )
            )
    )
);


create policy
marketplace_return_history_parties_read
on public.marketplace_return_status_history
for select
to authenticated
using (
    exists (
        select 1
        from public.marketplace_returns r
        where
            r.id =
            marketplace_return_status_history.return_id

            and (
                r.customer_id =
                    auth.uid()

                or

                public.marketplace_can_manage_seller_organization(
                    r.seller_organization_id
                )
            )
    )
);


grant select
on table public.marketplace_delivery_carriers
to authenticated;

grant select
on table public.marketplace_delivery_zones
to authenticated;

grant select
on table public.marketplace_delivery_zone_areas
to authenticated;

grant select
on table public.marketplace_returns
to authenticated;

grant select
on table public.marketplace_return_items
to authenticated;

grant select
on table public.marketplace_return_status_history
to authenticated;


revoke insert, update, delete
on table public.marketplace_delivery_carriers
from authenticated;

revoke insert, update, delete
on table public.marketplace_delivery_zones
from authenticated;

revoke insert, update, delete
on table public.marketplace_delivery_zone_areas
from authenticated;

revoke insert, update, delete
on table public.marketplace_returns
from authenticated;

revoke insert, update, delete
on table public.marketplace_return_items
from authenticated;

revoke insert, update, delete
on table public.marketplace_return_status_history
from authenticated;


-- ============================================================
-- SAVE CARRIER
-- ============================================================

create or replace function
public.marketplace_save_delivery_carrier(
    p_id uuid,
    p_name text,
    p_phone text default null,
    p_email text default null,
    p_website text default null,
    p_tracking_url_template text default null,
    p_notes text default null,
    p_status text default 'active'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_seller uuid;
    v_id uuid;
begin
    v_seller :=
        public.marketplace_current_seller_organization();

    if nullif(
        btrim(p_name),
        ''
    ) is null then
        raise exception
            using
                errcode = '22023',
                message =
                    'Carrier name is required';
    end if;

    if p_status not in (
        'active',
        'inactive'
    ) then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid carrier status';
    end if;

    if p_id is null then
        insert into
        public.marketplace_delivery_carriers (
            seller_organization_id,
            name,
            phone,
            email,
            website,
            tracking_url_template,
            notes,
            status,
            created_by
        )
        values (
            v_seller,
            btrim(p_name),
            nullif(
                btrim(p_phone),
                ''
            ),
            nullif(
                lower(
                    btrim(p_email)
                ),
                ''
            ),
            nullif(
                btrim(p_website),
                ''
            ),
            nullif(
                btrim(
                    p_tracking_url_template
                ),
                ''
            ),
            nullif(
                btrim(p_notes),
                ''
            ),
            p_status,
            auth.uid()
        )
        returning id
        into v_id;

        return v_id;
    end if;


    update
    public.marketplace_delivery_carriers
    set
        name =
            btrim(p_name),

        phone =
            nullif(
                btrim(p_phone),
                ''
            ),

        email =
            nullif(
                lower(
                    btrim(p_email)
                ),
                ''
            ),

        website =
            nullif(
                btrim(p_website),
                ''
            ),

        tracking_url_template =
            nullif(
                btrim(
                    p_tracking_url_template
                ),
                ''
            ),

        notes =
            nullif(
                btrim(p_notes),
                ''
            ),

        status =
            p_status,

        updated_at =
            now()

    where
        id =
            p_id

        and

        seller_organization_id =
            v_seller

        and

        status <>
            'archived';

    if not found then
        raise exception
            using
                errcode = '42501',
                message =
                    'Carrier access denied';
    end if;


    -- Keep historical delivery carrier display aligned
    -- when the registered carrier is renamed.

    update
    public.marketplace_deliveries
    set
        carrier =
            btrim(p_name),

        updated_at =
            now()

    where
        carrier_id =
            p_id;


    return p_id;
end;
$$;


-- ============================================================
-- ARCHIVE CARRIER
-- ============================================================

create or replace function
public.marketplace_archive_delivery_carrier(
    p_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_seller uuid;
begin
    v_seller :=
        public.marketplace_current_seller_organization();

    update
    public.marketplace_delivery_carriers
    set
        status =
            'archived',

        updated_at =
            now()

    where
        id =
            p_id

        and

        seller_organization_id =
            v_seller;

    if not found then
        raise exception
            using
                errcode = '42501',
                message =
                    'Carrier access denied';
    end if;
end;
$$;


-- ============================================================
-- ASSIGN CARRIER TO DELIVERY
--
-- Does not change commercial/order status.
-- ============================================================

create or replace function
public.marketplace_assign_delivery_carrier(
    p_delivery_id uuid,
    p_carrier_id uuid,
    p_tracking_number text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_seller uuid;
    v_carrier_name text;
begin
    v_seller :=
        public.marketplace_current_seller_organization();

    if not exists (
        select 1

        from
            public.marketplace_deliveries d

        join
            public.marketplace_orders o
          on o.id =
             d.order_id

        where
            d.id =
                p_delivery_id

            and

            d.method =
                'delivery'

            and

            o.seller_organization_id =
                v_seller
    ) then
        raise exception
            using
                errcode = '42501',
                message =
                    'Delivery access denied';
    end if;


    if p_carrier_id is not null then
        select
            c.name

        into
            v_carrier_name

        from
            public.marketplace_delivery_carriers c

        where
            c.id =
                p_carrier_id

            and

            c.seller_organization_id =
                v_seller

            and

            c.status =
                'active';

        if not found then
            raise exception
                using
                    errcode = '42501',
                    message =
                        'Carrier access denied';
        end if;
    end if;


    update
    public.marketplace_deliveries
    set
        carrier_id =
            p_carrier_id,

        carrier =
            case
                when p_carrier_id is null
                    then null

                else
                    v_carrier_name
            end,

        tracking_number =
            nullif(
                btrim(
                    p_tracking_number
                ),
                ''
            ),

        updated_at =
            now()

    where
        id =
            p_delivery_id;
end;
$$;


-- ============================================================
-- SAVE DELIVERY ZONE
-- ============================================================

create or replace function
public.marketplace_save_delivery_zone(
    p_id uuid,
    p_name text,
    p_delivery_fee numeric,
    p_currency text,
    p_min_delivery_days integer,
    p_max_delivery_days integer,
    p_free_delivery_threshold numeric,
    p_status text,
    p_areas jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_seller uuid;
    v_id uuid;
    v_currency text;

    v_area jsonb;

    v_region uuid;
    v_district uuid;
    v_city uuid;
    v_commune uuid;

    v_ref_region uuid;
    v_ref_district uuid;
    v_ref_city uuid;
begin
    v_seller :=
        public.marketplace_current_seller_organization();

    if nullif(
        btrim(p_name),
        ''
    ) is null then
        raise exception
            using
                errcode = '22023',
                message =
                    'Zone name is required';
    end if;


    if coalesce(
        p_delivery_fee,
        0
    ) < 0 then
        raise exception
            using
                errcode = '22023',
                message =
                    'Delivery fee cannot be negative';
    end if;


    if
        p_min_delivery_days is null

        or

        p_max_delivery_days is null

        or

        p_min_delivery_days < 0

        or

        p_max_delivery_days <
            p_min_delivery_days
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid delivery delay';
    end if;


    if
        p_free_delivery_threshold is not null

        and

        p_free_delivery_threshold < 0
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid free delivery threshold';
    end if;


    if p_status not in (
        'active',
        'inactive'
    ) then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid delivery zone status';
    end if;


    v_currency :=
        upper(
            coalesce(
                nullif(
                    btrim(p_currency),
                    ''
                ),
                'MGA'
            )
        );


    if not (
        v_currency ~
        '^[A-Z]{3}$'
    ) then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid currency code';
    end if;


    if
        p_areas is null

        or

        jsonb_typeof(
            p_areas
        ) <> 'array'

        or

        jsonb_array_length(
            p_areas
        ) = 0
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'At least one geographical area is required';
    end if;


    if p_id is null then
        insert into
        public.marketplace_delivery_zones (
            seller_organization_id,
            name,
            delivery_fee,
            currency,
            min_delivery_days,
            max_delivery_days,
            free_delivery_threshold,
            status,
            created_by
        )
        values (
            v_seller,
            btrim(p_name),
            coalesce(
                p_delivery_fee,
                0
            ),
            v_currency,
            p_min_delivery_days,
            p_max_delivery_days,
            p_free_delivery_threshold,
            p_status,
            auth.uid()
        )
        returning id
        into v_id;

    else
        update
        public.marketplace_delivery_zones
        set
            name =
                btrim(p_name),

            delivery_fee =
                coalesce(
                    p_delivery_fee,
                    0
                ),

            currency =
                v_currency,

            min_delivery_days =
                p_min_delivery_days,

            max_delivery_days =
                p_max_delivery_days,

            free_delivery_threshold =
                p_free_delivery_threshold,

            status =
                p_status,

            updated_at =
                now()

        where
            id =
                p_id

            and

            seller_organization_id =
                v_seller

            and

            status <>
                'archived';

        if not found then
            raise exception
                using
                    errcode = '42501',
                    message =
                        'Delivery zone access denied';
        end if;

        v_id :=
            p_id;

        delete from
        public.marketplace_delivery_zone_areas
        where
            zone_id =
                v_id;
    end if;


    for v_area in
        select
            value

        from
            jsonb_array_elements(
                p_areas
            )
    loop
        v_region :=
            nullif(
                v_area ->> 'regionId',
                ''
            )::uuid;

        v_district :=
            nullif(
                v_area ->> 'districtId',
                ''
            )::uuid;

        v_city :=
            nullif(
                v_area ->> 'cityId',
                ''
            )::uuid;

        v_commune :=
            nullif(
                v_area ->> 'communeId',
                ''
            )::uuid;


        if v_commune is not null then
            select
                c.region_id,
                c.district_id,
                c.city_id

            into
                v_ref_region,
                v_ref_district,
                v_ref_city

            from
                public.communes c

            where
                c.id =
                    v_commune;

            if not found then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'Invalid commune';
            end if;


            if
                v_region is not null

                and

                v_region <>
                    v_ref_region
            then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'Commune does not belong to selected region';
            end if;


            if
                v_district is not null

                and

                v_district <>
                    v_ref_district
            then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'Commune does not belong to selected district';
            end if;


            if
                v_city is not null

                and

                v_ref_city is not null

                and

                v_city <>
                    v_ref_city
            then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'Commune does not belong to selected city';
            end if;


            v_region :=
                v_ref_region;

            v_district :=
                v_ref_district;

            v_city :=
                coalesce(
                    v_city,
                    v_ref_city
                );


        elsif v_city is not null then
            select
                c.region_id,
                c.district_id

            into
                v_ref_region,
                v_ref_district

            from
                public.cities c

            where
                c.id =
                    v_city;

            if not found then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'Invalid city';
            end if;


            if
                v_region is not null

                and

                v_region <>
                    v_ref_region
            then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'City does not belong to selected region';
            end if;


            if
                v_district is not null

                and

                v_ref_district is not null

                and

                v_district <>
                    v_ref_district
            then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'City does not belong to selected district';
            end if;


            v_region :=
                v_ref_region;

            v_district :=
                coalesce(
                    v_district,
                    v_ref_district
                );


        elsif v_district is not null then
            select
                d.region_id

            into
                v_ref_region

            from
                public.districts d

            where
                d.id =
                    v_district;

            if not found then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'Invalid district';
            end if;


            if
                v_region is not null

                and

                v_region <>
                    v_ref_region
            then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'District does not belong to selected region';
            end if;


            v_region :=
                v_ref_region;


        elsif v_region is not null then
            if not exists (
                select 1
                from public.regions r
                where
                    r.id =
                        v_region
            ) then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'Invalid region';
            end if;


        else
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Invalid geographical area';
        end if;


        insert into
        public.marketplace_delivery_zone_areas (
            zone_id,
            region_id,
            district_id,
            city_id,
            commune_id
        )
        values (
            v_id,
            v_region,
            v_district,
            v_city,
            v_commune
        );
    end loop;


    return v_id;
end;
$$;


-- ============================================================
-- ARCHIVE DELIVERY ZONE
-- ============================================================

create or replace function
public.marketplace_archive_delivery_zone(
    p_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_seller uuid;
begin
    v_seller :=
        public.marketplace_current_seller_organization();

    update
    public.marketplace_delivery_zones
    set
        status =
            'archived',

        updated_at =
            now()

    where
        id =
            p_id

        and

        seller_organization_id =
            v_seller;

    if not found then
        raise exception
            using
                errcode = '42501',
                message =
                    'Delivery zone access denied';
    end if;
end;
$$;


-- ============================================================
-- CREATE RETURN
-- ============================================================

create or replace function
public.marketplace_create_return(
    p_order_id uuid,
    p_reason text,
    p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_seller uuid;

    v_order
        public.marketplace_orders%rowtype;

    v_return_id uuid;

    v_item jsonb;

    v_line
        public.marketplace_order_lines%rowtype;

    v_quantity integer;

    v_condition text;

    v_existing_quantity integer;
begin
    v_seller :=
        public.marketplace_current_seller_organization();


    select *
    into
        v_order

    from
        public.marketplace_orders

    where
        id =
            p_order_id

        and

        seller_organization_id =
            v_seller

    for update;


    if not found then
        raise exception
            using
                errcode = '42501',
                message =
                    'Order access denied';
    end if;


    if v_order.status <>
        'delivered'
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Only delivered orders can enter the return workflow';
    end if;


    if nullif(
        btrim(p_reason),
        ''
    ) is null then
        raise exception
            using
                errcode = '22023',
                message =
                    'Return reason is required';
    end if;


    if
        p_items is null

        or

        jsonb_typeof(
            p_items
        ) <> 'array'

        or

        jsonb_array_length(
            p_items
        ) = 0
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'At least one returned item is required';
    end if;


    insert into
    public.marketplace_returns (
        seller_organization_id,
        order_id,
        customer_id,
        reason,
        status,
        created_by
    )
    values (
        v_seller,
        v_order.id,
        v_order.customer_id,
        btrim(p_reason),
        'requested',
        auth.uid()
    )
    returning id
    into
        v_return_id;


    for v_item in
        select
            value

        from
            jsonb_array_elements(
                p_items
            )
    loop
        select *
        into
            v_line

        from
            public.marketplace_order_lines

        where
            id =
                nullif(
                    v_item ->> 'orderLineId',
                    ''
                )::uuid

            and

            order_id =
                v_order.id;


        if not found then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Invalid return order line';
        end if;


        if v_line.mode <>
            'sale'
        then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Rental returns use the rental workflow';
        end if;


        v_quantity :=
            coalesce(
                nullif(
                    v_item ->> 'quantity',
                    ''
                )::integer,
                0
            );


        if v_quantity <= 0 then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Return quantity must be positive';
        end if;


        select
            coalesce(
                sum(
                    ri.quantity
                ),
                0
            )::integer

        into
            v_existing_quantity

        from
            public.marketplace_return_items ri

        join
            public.marketplace_returns r
          on r.id =
             ri.return_id

        where
            ri.order_line_id =
                v_line.id

            and

            r.status not in (
                'rejected',
                'cancelled'
            );


        if
            (
                v_existing_quantity +
                v_quantity
            ) >
            v_line.quantity
        then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Returned quantity exceeds ordered quantity';
        end if;


        v_condition :=
            coalesce(
                nullif(
                    v_item ->> 'condition',
                    ''
                ),
                'good'
            );


        if v_condition not in (
            'unopened',
            'good',
            'damaged',
            'defective',
            'other'
        ) then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Invalid return item condition';
        end if;


        insert into
        public.marketplace_return_items (
            return_id,
            order_line_id,
            quantity,
            condition,
            note
        )
        values (
            v_return_id,
            v_line.id,
            v_quantity,
            v_condition,
            nullif(
                btrim(
                    v_item ->> 'note'
                ),
                ''
            )
        );
    end loop;


    insert into
    public.marketplace_return_status_history (
        return_id,
        from_status,
        to_status,
        note,
        changed_by
    )
    values (
        v_return_id,
        null,
        'requested',
        'Retour enregistré dans ERP vendeur',
        auth.uid()
    );


    return v_return_id;
end;
$$;


-- ============================================================
-- TRANSITION RETURN
-- ============================================================

create or replace function
public.marketplace_transition_return(
    p_return_id uuid,
    p_status text,
    p_note text default null,
    p_resolution text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_seller uuid;

    v_return
        public.marketplace_returns%rowtype;

    v_allowed boolean :=
        false;
begin
    v_seller :=
        public.marketplace_current_seller_organization();


    select *
    into
        v_return

    from
        public.marketplace_returns

    where
        id =
            p_return_id

        and

        seller_organization_id =
            v_seller

    for update;


    if not found then
        raise exception
            using
                errcode = '42501',
                message =
                    'Return access denied';
    end if;


    if v_return.status =
        p_status
    then
        return;
    end if;


    v_allowed :=
        (
            v_return.status =
                'requested'

            and

            p_status in (
                'approved',
                'rejected',
                'cancelled'
            )
        )

        or

        (
            v_return.status =
                'approved'

            and

            p_status in (
                'received',
                'cancelled'
            )
        )

        or

        (
            v_return.status =
                'received'

            and

            p_status =
                'resolved'
        );


    if not v_allowed then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid return status transition';
    end if;


    if
        p_status =
            'resolved'

        and

        p_resolution not in (
            'refund',
            'exchange',
            'store_credit',
            'none'
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Resolution is required';
    end if;


    update
    public.marketplace_returns
    set
        status =
            p_status,

        resolution =
            case
                when p_status =
                    'resolved'
                then
                    p_resolution
                else
                    resolution
            end,

        received_at =
            case
                when p_status =
                    'received'
                then
                    now()
                else
                    received_at
            end,

        resolved_at =
            case
                when p_status =
                    'resolved'
                then
                    now()
                else
                    resolved_at
            end,

        updated_at =
            now()

    where
        id =
            p_return_id;


    insert into
    public.marketplace_return_status_history (
        return_id,
        from_status,
        to_status,
        note,
        changed_by
    )
    values (
        p_return_id,
        v_return.status,
        p_status,
        nullif(
            btrim(p_note),
            ''
        ),
        auth.uid()
    );


    -- Intentionally no:
    --
    -- inventory update
    -- stock movement
    -- payment update
    -- ledger mutation
    -- order refund transition
end;
$$;


-- ============================================================
-- MANAGEMENT SNAPSHOT
-- ============================================================

create or replace function
public.marketplace_delivery_management_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v_seller uuid;
begin
    v_seller :=
        public.marketplace_current_seller_organization();


    return
        jsonb_build_object(

            'organizationId',
                v_seller,


            'deliveries',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        d.id,

                                    'orderId',
                                        d.order_id,

                                    'method',
                                        d.method,

                                    'address',
                                        d.address,

                                    'status',
                                        d.status,

                                    'carrierId',
                                        d.carrier_id,

                                    'carrier',
                                        d.carrier,

                                    'trackingNumber',
                                        d.tracking_number,

                                    'updatedAt',
                                        d.updated_at
                                )
                                order by
                                    d.updated_at desc
                            )

                        from
                            public.marketplace_deliveries d

                        join
                            public.marketplace_orders o
                          on o.id =
                             d.order_id

                        where
                            o.seller_organization_id =
                                v_seller

                            and

                            d.method =
                                'delivery'
                    ),
                    '[]'::jsonb
                ),


            'carriers',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        c.id,

                                    'name',
                                        c.name,

                                    'phone',
                                        c.phone,

                                    'email',
                                        c.email,

                                    'website',
                                        c.website,

                                    'trackingUrlTemplate',
                                        c.tracking_url_template,

                                    'notes',
                                        c.notes,

                                    'status',
                                        c.status,

                                    'usageCount',
                                        (
                                            select
                                                count(*)

                                            from
                                                public.marketplace_deliveries d

                                            where
                                                d.carrier_id =
                                                    c.id
                                        ),

                                    'createdAt',
                                        c.created_at,

                                    'updatedAt',
                                        c.updated_at
                                )
                                order by
                                    c.created_at desc
                            )

                        from
                            public.marketplace_delivery_carriers c

                        where
                            c.seller_organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'zones',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        z.id,

                                    'name',
                                        z.name,

                                    'deliveryFee',
                                        z.delivery_fee,

                                    'currency',
                                        z.currency,

                                    'minDeliveryDays',
                                        z.min_delivery_days,

                                    'maxDeliveryDays',
                                        z.max_delivery_days,

                                    'freeDeliveryThreshold',
                                        z.free_delivery_threshold,

                                    'status',
                                        z.status,

                                    'createdAt',
                                        z.created_at,

                                    'updatedAt',
                                        z.updated_at,

                                    'areas',
                                        coalesce(
                                            (
                                                select
                                                    jsonb_agg(
                                                        jsonb_build_object(
                                                            'id',
                                                                a.id,

                                                            'regionId',
                                                                a.region_id,

                                                            'districtId',
                                                                a.district_id,

                                                            'cityId',
                                                                a.city_id,

                                                            'communeId',
                                                                a.commune_id
                                                        )
                                                        order by
                                                            a.created_at
                                                    )

                                                from
                                                    public.marketplace_delivery_zone_areas a

                                                where
                                                    a.zone_id =
                                                        z.id
                                            ),
                                            '[]'::jsonb
                                        )
                                )
                                order by
                                    z.created_at desc
                            )

                        from
                            public.marketplace_delivery_zones z

                        where
                            z.seller_organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'returns',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        r.id,

                                    'orderId',
                                        r.order_id,

                                    'customerId',
                                        r.customer_id,

                                    'customerName',
                                        o.customer_name,

                                    'currency',
                                        o.currency,

                                    'reason',
                                        r.reason,

                                    'status',
                                        r.status,

                                    'resolution',
                                        r.resolution,

                                    'requestedAt',
                                        r.requested_at,

                                    'receivedAt',
                                        r.received_at,

                                    'resolvedAt',
                                        r.resolved_at,

                                    'updatedAt',
                                        r.updated_at,

                                    'items',
                                        coalesce(
                                            (
                                                select
                                                    jsonb_agg(
                                                        jsonb_build_object(
                                                            'id',
                                                                ri.id,

                                                            'orderLineId',
                                                                ri.order_line_id,

                                                            'productId',
                                                                ol.product_id,

                                                            'productTitle',
                                                                ol.product_title,

                                                            'quantity',
                                                                ri.quantity,

                                                            'condition',
                                                                ri.condition,

                                                            'note',
                                                                ri.note
                                                        )
                                                        order by
                                                            ri.created_at
                                                    )

                                                from
                                                    public.marketplace_return_items ri

                                                join
                                                    public.marketplace_order_lines ol
                                                  on ol.id =
                                                     ri.order_line_id

                                                where
                                                    ri.return_id =
                                                        r.id
                                            ),
                                            '[]'::jsonb
                                        ),

                                    'history',
                                        coalesce(
                                            (
                                                select
                                                    jsonb_agg(
                                                        jsonb_build_object(
                                                            'id',
                                                                h.id,

                                                            'fromStatus',
                                                                h.from_status,

                                                            'toStatus',
                                                                h.to_status,

                                                            'note',
                                                                h.note,

                                                            'createdAt',
                                                                h.created_at
                                                        )
                                                        order by
                                                            h.created_at
                                                    )

                                                from
                                                    public.marketplace_return_status_history h

                                                where
                                                    h.return_id =
                                                        r.id
                                            ),
                                            '[]'::jsonb
                                        )
                                )
                                order by
                                    r.requested_at desc
                            )

                        from
                            public.marketplace_returns r

                        join
                            public.marketplace_orders o
                          on o.id =
                             r.order_id

                        where
                            r.seller_organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'returnCandidateOrders',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        o.id,

                                    'customerName',
                                        o.customer_name,

                                    'currency',
                                        o.currency,

                                    'total',
                                        o.total,

                                    'createdAt',
                                        o.created_at,

                                    'lines',
                                        coalesce(
                                            (
                                                select
                                                    jsonb_agg(
                                                        jsonb_build_object(
                                                            'id',
                                                                ol.id,

                                                            'productId',
                                                                ol.product_id,

                                                            'productTitle',
                                                                ol.product_title,

                                                            'quantity',
                                                                ol.quantity,

                                                            'unitPrice',
                                                                ol.unit_price
                                                        )
                                                        order by
                                                            ol.created_at
                                                    )

                                                from
                                                    public.marketplace_order_lines ol

                                                where
                                                    ol.order_id =
                                                        o.id

                                                    and

                                                    ol.mode =
                                                        'sale'
                                            ),
                                            '[]'::jsonb
                                        )
                                )
                                order by
                                    o.created_at desc
                            )

                        from
                            public.marketplace_orders o

                        where
                            o.seller_organization_id =
                                v_seller

                            and

                            o.status =
                                'delivered'

                            and

                            exists (
                                select 1

                                from
                                    public.marketplace_order_lines candidate

                                where
                                    candidate.order_id =
                                        o.id

                                    and

                                    candidate.mode =
                                        'sale'
                            )
                    ),
                    '[]'::jsonb
                )
        );
end;
$$;


-- ============================================================
-- FUNCTION PERMISSIONS
-- ============================================================

revoke all
on function
public.marketplace_save_delivery_carrier(
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text
)
from public, anon;


revoke all
on function
public.marketplace_archive_delivery_carrier(
    uuid
)
from public, anon;


revoke all
on function
public.marketplace_assign_delivery_carrier(
    uuid,
    uuid,
    text
)
from public, anon;


revoke all
on function
public.marketplace_save_delivery_zone(
    uuid,
    text,
    numeric,
    text,
    integer,
    integer,
    numeric,
    text,
    jsonb
)
from public, anon;


revoke all
on function
public.marketplace_archive_delivery_zone(
    uuid
)
from public, anon;


revoke all
on function
public.marketplace_create_return(
    uuid,
    text,
    jsonb
)
from public, anon;


revoke all
on function
public.marketplace_transition_return(
    uuid,
    text,
    text,
    text
)
from public, anon;


revoke all
on function
public.marketplace_delivery_management_snapshot()
from public, anon;


grant execute
on function
public.marketplace_save_delivery_carrier(
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


grant execute
on function
public.marketplace_archive_delivery_carrier(
    uuid
)
to authenticated;


grant execute
on function
public.marketplace_assign_delivery_carrier(
    uuid,
    uuid,
    text
)
to authenticated;


grant execute
on function
public.marketplace_save_delivery_zone(
    uuid,
    text,
    numeric,
    text,
    integer,
    integer,
    numeric,
    text,
    jsonb
)
to authenticated;


grant execute
on function
public.marketplace_archive_delivery_zone(
    uuid
)
to authenticated;


grant execute
on function
public.marketplace_create_return(
    uuid,
    text,
    jsonb
)
to authenticated;


grant execute
on function
public.marketplace_transition_return(
    uuid,
    text,
    text,
    text
)
to authenticated;


grant execute
on function
public.marketplace_delivery_management_snapshot()
to authenticated;


commit;