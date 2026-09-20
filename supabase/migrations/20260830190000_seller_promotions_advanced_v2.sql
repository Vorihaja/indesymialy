begin;


-- ============================================================
-- INDESY MIALY
-- SELLER PROMOTIONS ADVANCED V2
--
-- BUNDLES + PARTNERSHIPS
--
-- This is ERP configuration authority only.
--
-- Explicitly NOT integrated with:
-- - cart
-- - marketplace_checkout
-- - marketplace_orders pricing
-- - marketplace_transactions
-- - marketplace_payments
-- - products.price mutation
-- - marketplace_inventory
--
-- Marketplace integration will be handled during Marketplace
-- redesign.
-- ============================================================


-- ============================================================
-- BUNDLES
-- ============================================================

create table
public.marketplace_bundles (
    id uuid primary key
        default gen_random_uuid(),

    seller_organization_id uuid not null
        references public.organizations(id)
        on delete restrict,

    name text not null,

    description text,

    pricing_mode text not null
        check (
            pricing_mode in (
                'fixed_price',
                'percent_discount'
            )
        ),

    fixed_price numeric(14,2),

    discount_percent numeric(7,2),

    currency char(3) not null
        default 'MGA',

    status text not null
        default 'draft'
        check (
            status in (
                'draft',
                'active',
                'paused',
                'archived'
            )
        ),

    starts_at timestamptz,

    ends_at timestamptz,

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    marketplace_bundles_name_not_blank
        check (
            length(
                btrim(name)
            ) > 0
        ),

    constraint
    marketplace_bundles_currency_check
        check (
            currency ~ '^[A-Z]{3}$'
        ),

    constraint
    marketplace_bundles_dates_check
        check (
            ends_at is null
            or starts_at is null
            or ends_at > starts_at
        ),

    constraint
    marketplace_bundles_pricing_check
        check (
            (
                pricing_mode =
                    'fixed_price'

                and fixed_price is not null

                and fixed_price > 0

                and discount_percent is null
            )

            or

            (
                pricing_mode =
                    'percent_discount'

                and discount_percent is not null

                and discount_percent > 0

                and discount_percent <= 100

                and fixed_price is null
            )
        )
);


create unique index
marketplace_bundles_seller_name_uidx
on public.marketplace_bundles (
    seller_organization_id,
    lower(
        btrim(name)
    )
)
where status <> 'archived';


create index
marketplace_bundles_seller_status_idx
on public.marketplace_bundles (
    seller_organization_id,
    status,
    created_at desc
);


create table
public.marketplace_bundle_items (
    bundle_id uuid not null
        references public.marketplace_bundles(id)
        on delete cascade,

    product_id uuid not null
        references public.products(id)
        on delete restrict,

    quantity integer not null
        check (
            quantity > 0
        ),

    sort_order integer not null
        default 0
        check (
            sort_order >= 0
        ),

    created_at timestamptz not null
        default now(),

    primary key (
        bundle_id,
        product_id
    )
);


create index
marketplace_bundle_items_product_idx
on public.marketplace_bundle_items (
    product_id
);


-- ============================================================
-- PARTNERSHIPS
-- ============================================================

create table
public.marketplace_partnerships (
    id uuid primary key
        default gen_random_uuid(),

    seller_organization_id uuid not null
        references public.organizations(id)
        on delete restrict,

    partner_organization_id uuid
        references public.organizations(id)
        on delete set null,

    partner_name text not null,

    contact_name text,

    contact_email text,

    contact_phone text,

    partnership_type text not null
        check (
            partnership_type in (
                'affiliate',
                'co_marketing',
                'sponsorship',
                'supplier',
                'ambassador',
                'distribution',
                'other'
            )
        ),

    description text,

    benefit_type text not null
        check (
            benefit_type in (
                'percent_discount',
                'fixed_discount',
                'promotion_code',
                'visibility',
                'other'
            )
        ),

    benefit_value numeric(14,2),

    currency char(3) not null
        default 'MGA',

    promotion_code text,

    status text not null
        default 'draft'
        check (
            status in (
                'draft',
                'active',
                'paused',
                'archived'
            )
        ),

    starts_at timestamptz,

    ends_at timestamptz,

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    marketplace_partnerships_name_not_blank
        check (
            length(
                btrim(partner_name)
            ) > 0
        ),

    constraint
    marketplace_partnerships_dates_check
        check (
            ends_at is null
            or starts_at is null
            or ends_at > starts_at
        ),

    constraint
    marketplace_partnerships_currency_check
        check (
            currency ~ '^[A-Z]{3}$'
        ),

    constraint
    marketplace_partnerships_benefit_check
        check (
            (
                benefit_type =
                    'percent_discount'

                and benefit_value is not null

                and benefit_value > 0

                and benefit_value <= 100
            )

            or

            (
                benefit_type =
                    'fixed_discount'

                and benefit_value is not null

                and benefit_value > 0
            )

            or

            (
                benefit_type =
                    'promotion_code'

                and promotion_code is not null

                and length(
                    btrim(
                        promotion_code
                    )
                ) >= 2
            )

            or

            benefit_type in (
                'visibility',
                'other'
            )
        )
);


create index
marketplace_partnerships_seller_status_idx
on public.marketplace_partnerships (
    seller_organization_id,
    status,
    created_at desc
);


create unique index
marketplace_partnerships_seller_code_uidx
on public.marketplace_partnerships (
    seller_organization_id,
    lower(
        btrim(
            promotion_code
        )
    )
)
where
    promotion_code is not null
    and status <> 'archived';


create table
public.marketplace_partnership_products (
    partnership_id uuid not null
        references public.marketplace_partnerships(id)
        on delete cascade,

    product_id uuid not null
        references public.products(id)
        on delete restrict,

    created_at timestamptz not null
        default now(),

    primary key (
        partnership_id,
        product_id
    )
);


create index
marketplace_partnership_products_product_idx
on public.marketplace_partnership_products (
    product_id
);


create table
public.marketplace_partnership_status_history (
    id uuid primary key
        default gen_random_uuid(),

    partnership_id uuid not null
        references public.marketplace_partnerships(id)
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
marketplace_partnership_history_idx
on public.marketplace_partnership_status_history (
    partnership_id,
    created_at
);


-- ============================================================
-- RLS
-- ============================================================

alter table
public.marketplace_bundles
enable row level security;

alter table
public.marketplace_bundle_items
enable row level security;

alter table
public.marketplace_partnerships
enable row level security;

alter table
public.marketplace_partnership_products
enable row level security;

alter table
public.marketplace_partnership_status_history
enable row level security;


create policy
marketplace_bundles_seller_read
on public.marketplace_bundles
for select
to authenticated
using (
    public.marketplace_can_manage_seller_organization(
        seller_organization_id
    )
);


create policy
marketplace_bundle_items_seller_read
on public.marketplace_bundle_items
for select
to authenticated
using (
    exists (
        select 1

        from
            public.marketplace_bundles bundle

        where
            bundle.id =
                marketplace_bundle_items.bundle_id

            and

            public.marketplace_can_manage_seller_organization(
                bundle.seller_organization_id
            )
    )
);


create policy
marketplace_partnerships_seller_read
on public.marketplace_partnerships
for select
to authenticated
using (
    public.marketplace_can_manage_seller_organization(
        seller_organization_id
    )
);


create policy
marketplace_partnership_products_seller_read
on public.marketplace_partnership_products
for select
to authenticated
using (
    exists (
        select 1

        from
            public.marketplace_partnerships partnership

        where
            partnership.id =
                marketplace_partnership_products.partnership_id

            and

            public.marketplace_can_manage_seller_organization(
                partnership.seller_organization_id
            )
    )
);


create policy
marketplace_partnership_history_seller_read
on public.marketplace_partnership_status_history
for select
to authenticated
using (
    exists (
        select 1

        from
            public.marketplace_partnerships partnership

        where
            partnership.id =
                marketplace_partnership_status_history.partnership_id

            and

            public.marketplace_can_manage_seller_organization(
                partnership.seller_organization_id
            )
    )
);


grant select
on table public.marketplace_bundles
to authenticated;

grant select
on table public.marketplace_bundle_items
to authenticated;

grant select
on table public.marketplace_partnerships
to authenticated;

grant select
on table public.marketplace_partnership_products
to authenticated;

grant select
on table public.marketplace_partnership_status_history
to authenticated;


revoke insert, update, delete
on table public.marketplace_bundles
from public, anon, authenticated;

revoke insert, update, delete
on table public.marketplace_bundle_items
from public, anon, authenticated;

revoke insert, update, delete
on table public.marketplace_partnerships
from public, anon, authenticated;

revoke insert, update, delete
on table public.marketplace_partnership_products
from public, anon, authenticated;

revoke insert, update, delete
on table public.marketplace_partnership_status_history
from public, anon, authenticated;


-- ============================================================
-- SAVE BUNDLE
-- ============================================================

create or replace function
public.marketplace_save_bundle(
    p_bundle_id uuid,
    p_name text,
    p_description text,
    p_pricing_mode text,
    p_fixed_price numeric,
    p_discount_percent numeric,
    p_currency text,
    p_status text,
    p_starts_at timestamptz,
    p_ends_at timestamptz,
    p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_seller uuid;

    v_id uuid;

    v_item jsonb;

    v_product_id uuid;

    v_quantity integer;

    v_sort_order integer;

    v_distinct_count integer;

    v_currency text;
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
                    'Bundle name is required';
    end if;


    if p_pricing_mode not in (
        'fixed_price',
        'percent_discount'
    ) then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid bundle pricing mode';
    end if;


    if
        p_pricing_mode =
            'fixed_price'

        and (
            p_fixed_price is null
            or p_fixed_price <= 0
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Bundle fixed price must be positive';
    end if;


    if
        p_pricing_mode =
            'percent_discount'

        and (
            p_discount_percent is null
            or p_discount_percent <= 0
            or p_discount_percent > 100
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Bundle discount must be between 0 and 100';
    end if;


    if p_status not in (
        'draft',
        'active',
        'paused'
    ) then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid bundle status';
    end if;


    if
        p_ends_at is not null

        and

        p_starts_at is not null

        and

        p_ends_at <=
            p_starts_at
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Bundle end date must be after start date';
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
                    'Invalid currency';
    end if;


    if
        p_items is null

        or

        jsonb_typeof(
            p_items
        ) <> 'array'
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Bundle items must be an array';
    end if;


    select
        count(
            distinct
            nullif(
                item ->> 'productId',
                ''
            )
        )::integer

    into
        v_distinct_count

    from
        jsonb_array_elements(
            p_items
        ) item;


    if v_distinct_count < 2 then
        raise exception
            using
                errcode = '22023',
                message =
                    'A bundle requires at least two distinct products';
    end if;


    if p_bundle_id is null then
        insert into
        public.marketplace_bundles (
            seller_organization_id,
            name,
            description,
            pricing_mode,
            fixed_price,
            discount_percent,
            currency,
            status,
            starts_at,
            ends_at,
            created_by
        )
        values (
            v_seller,
            btrim(p_name),
            nullif(
                btrim(p_description),
                ''
            ),
            p_pricing_mode,
            case
                when p_pricing_mode =
                    'fixed_price'
                then p_fixed_price
                else null
            end,
            case
                when p_pricing_mode =
                    'percent_discount'
                then p_discount_percent
                else null
            end,
            v_currency,
            p_status,
            p_starts_at,
            p_ends_at,
            auth.uid()
        )
        returning id
        into v_id;

    else
        update
        public.marketplace_bundles
        set
            name =
                btrim(p_name),

            description =
                nullif(
                    btrim(p_description),
                    ''
                ),

            pricing_mode =
                p_pricing_mode,

            fixed_price =
                case
                    when p_pricing_mode =
                        'fixed_price'
                    then p_fixed_price
                    else null
                end,

            discount_percent =
                case
                    when p_pricing_mode =
                        'percent_discount'
                    then p_discount_percent
                    else null
                end,

            currency =
                v_currency,

            status =
                p_status,

            starts_at =
                p_starts_at,

            ends_at =
                p_ends_at,

            updated_at =
                now()

        where
            id =
                p_bundle_id

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
                        'Bundle access denied';
        end if;

        v_id :=
            p_bundle_id;

        delete from
            public.marketplace_bundle_items
        where
            bundle_id =
                v_id;
    end if;


    for v_item in
        select value
        from
            jsonb_array_elements(
                p_items
            )
    loop
        v_product_id :=
            nullif(
                v_item ->> 'productId',
                ''
            )::uuid;

        v_quantity :=
            coalesce(
                nullif(
                    v_item ->> 'quantity',
                    ''
                )::integer,
                0
            );

        v_sort_order :=
            coalesce(
                nullif(
                    v_item ->> 'sortOrder',
                    ''
                )::integer,
                0
            );


        if v_product_id is null then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Bundle product is required';
        end if;


        if v_quantity <= 0 then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Bundle quantity must be positive';
        end if;


        if v_sort_order < 0 then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Bundle sort order cannot be negative';
        end if;


        if not exists (
            select 1

            from
                public.products product

            join
                public.marketplace_products extension

              on
                extension.product_id =
                    product.id

            where
                product.id =
                    v_product_id

                and

                product.seller_id =
                    v_seller

                and

                extension.listing_type <>
                    'rental'

                and

                extension.status <>
                    'archived'
        ) then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Bundle product is unavailable or does not belong to seller';
        end if;


        insert into
        public.marketplace_bundle_items (
            bundle_id,
            product_id,
            quantity,
            sort_order
        )
        values (
            v_id,
            v_product_id,
            v_quantity,
            v_sort_order
        )
        on conflict (
            bundle_id,
            product_id
        )
        do update
        set
            quantity =
                excluded.quantity,

            sort_order =
                excluded.sort_order;
    end loop;


    return v_id;
end;
$$;


-- ============================================================
-- BUNDLE STATUS
-- ============================================================

create or replace function
public.marketplace_set_bundle_status(
    p_bundle_id uuid,
    p_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_seller uuid;

    v_current text;

    v_allowed boolean :=
        false;
begin
    v_seller :=
        public.marketplace_current_seller_organization();


    if p_status not in (
        'active',
        'paused',
        'archived'
    ) then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid bundle status';
    end if;


    select
        status

    into
        v_current

    from
        public.marketplace_bundles

    where
        id =
            p_bundle_id

        and

        seller_organization_id =
            v_seller

    for update;


    if not found then
        raise exception
            using
                errcode = '42501',
                message =
                    'Bundle access denied';
    end if;


    if v_current =
        'archived'
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Archived bundle cannot be restored';
    end if;


    if v_current =
        p_status
    then
        return p_bundle_id;
    end if;


    v_allowed :=
        (
            v_current =
                'draft'

            and

            p_status in (
                'active',
                'archived'
            )
        )

        or

        (
            v_current =
                'active'

            and

            p_status in (
                'paused',
                'archived'
            )
        )

        or

        (
            v_current =
                'paused'

            and

            p_status in (
                'active',
                'archived'
            )
        );


    if not v_allowed then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid bundle status transition';
    end if;


    update
    public.marketplace_bundles
    set
        status =
            p_status,

        updated_at =
            now()

    where
        id =
            p_bundle_id;


    return p_bundle_id;
end;
$$;


-- ============================================================
-- SAVE PARTNERSHIP
-- ============================================================

create or replace function
public.marketplace_save_partnership(
    p_partnership_id uuid,
    p_partner_organization_id uuid,
    p_partner_name text,
    p_contact_name text,
    p_contact_email text,
    p_contact_phone text,
    p_partnership_type text,
    p_description text,
    p_benefit_type text,
    p_benefit_value numeric,
    p_currency text,
    p_promotion_code text,
    p_status text,
    p_starts_at timestamptz,
    p_ends_at timestamptz,
    p_product_ids uuid[]
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

    v_name text;

    v_current_status text;

    v_product_id uuid;
begin
    v_seller :=
        public.marketplace_current_seller_organization();


    if
        p_partner_organization_id is not null
    then
        if
            p_partner_organization_id =
                v_seller
        then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Seller cannot partner with itself';
        end if;


        if not exists (
            select 1
            from public.organizations organization
            where
                organization.id =
                    p_partner_organization_id

                and

                coalesce(
                    organization.status,
                    'active'
                ) =
                    'active'
        ) then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Partner organization is unavailable';
        end if;
    end if;


    v_name :=
        nullif(
            btrim(
                p_partner_name
            ),
            ''
        );


    if v_name is null then
        if
            p_partner_organization_id is null
        then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Partner name is required';
        end if;

        select
            organization.name

        into
            v_name

        from
            public.organizations organization

        where
            organization.id =
                p_partner_organization_id;
    end if;


    if p_partnership_type not in (
        'affiliate',
        'co_marketing',
        'sponsorship',
        'supplier',
        'ambassador',
        'distribution',
        'other'
    ) then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid partnership type';
    end if;


    if p_benefit_type not in (
        'percent_discount',
        'fixed_discount',
        'promotion_code',
        'visibility',
        'other'
    ) then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid partnership benefit';
    end if;


    if
        p_benefit_type =
            'percent_discount'

        and (
            p_benefit_value is null
            or p_benefit_value <= 0
            or p_benefit_value > 100
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Partnership percent must be between 0 and 100';
    end if;


    if
        p_benefit_type =
            'fixed_discount'

        and (
            p_benefit_value is null
            or p_benefit_value <= 0
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Partnership fixed benefit must be positive';
    end if;


    if
        p_benefit_type =
            'promotion_code'

        and

        length(
            btrim(
                coalesce(
                    p_promotion_code,
                    ''
                )
            )
        ) < 2
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Partnership promotion code is required';
    end if;


    if p_status not in (
        'draft',
        'active',
        'paused'
    ) then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid partnership status';
    end if;


    if
        p_ends_at is not null

        and

        p_starts_at is not null

        and

        p_ends_at <=
            p_starts_at
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Partnership end date must be after start date';
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
                    'Invalid currency';
    end if;


    if p_product_ids is not null then
        foreach
            v_product_id

        in array
            p_product_ids
        loop
            if not exists (
                select 1

                from
                    public.products product

                where
                    product.id =
                        v_product_id

                    and

                    product.seller_id =
                        v_seller
            ) then
                raise exception
                    using
                        errcode = '22023',
                        message =
                            'Partnership product does not belong to seller';
            end if;
        end loop;
    end if;


    if p_partnership_id is null then
        insert into
        public.marketplace_partnerships (
            seller_organization_id,
            partner_organization_id,
            partner_name,
            contact_name,
            contact_email,
            contact_phone,
            partnership_type,
            description,
            benefit_type,
            benefit_value,
            currency,
            promotion_code,
            status,
            starts_at,
            ends_at,
            created_by
        )
        values (
            v_seller,
            p_partner_organization_id,
            v_name,
            nullif(
                btrim(p_contact_name),
                ''
            ),
            nullif(
                lower(
                    btrim(
                        p_contact_email
                    )
                ),
                ''
            ),
            nullif(
                btrim(
                    p_contact_phone
                ),
                ''
            ),
            p_partnership_type,
            nullif(
                btrim(
                    p_description
                ),
                ''
            ),
            p_benefit_type,
            case
                when p_benefit_type in (
                    'percent_discount',
                    'fixed_discount'
                )
                then
                    p_benefit_value

                else
                    null
            end,
            v_currency,
            case
                when p_benefit_type =
                    'promotion_code'
                then
                    upper(
                        btrim(
                            p_promotion_code
                        )
                    )

                else
                    null
            end,
            p_status,
            p_starts_at,
            p_ends_at,
            auth.uid()
        )
        returning id
        into v_id;


        insert into
        public.marketplace_partnership_status_history (
            partnership_id,
            from_status,
            to_status,
            note,
            changed_by
        )
        values (
            v_id,
            null,
            p_status,
            'Partenariat créé',
            auth.uid()
        );

    else
        select
            status

        into
            v_current_status

        from
            public.marketplace_partnerships

        where
            id =
                p_partnership_id

            and

            seller_organization_id =
                v_seller

        for update;


        if not found then
            raise exception
                using
                    errcode = '42501',
                    message =
                        'Partnership access denied';
        end if;


        if
            v_current_status =
                'archived'
        then
            raise exception
                using
                    errcode = '22023',
                    message =
                        'Archived partnership cannot be edited';
        end if;


        update
        public.marketplace_partnerships
        set
            partner_organization_id =
                p_partner_organization_id,

            partner_name =
                v_name,

            contact_name =
                nullif(
                    btrim(
                        p_contact_name
                    ),
                    ''
                ),

            contact_email =
                nullif(
                    lower(
                        btrim(
                            p_contact_email
                        )
                    ),
                    ''
                ),

            contact_phone =
                nullif(
                    btrim(
                        p_contact_phone
                    ),
                    ''
                ),

            partnership_type =
                p_partnership_type,

            description =
                nullif(
                    btrim(
                        p_description
                    ),
                    ''
                ),

            benefit_type =
                p_benefit_type,

            benefit_value =
                case
                    when p_benefit_type in (
                        'percent_discount',
                        'fixed_discount'
                    )
                    then
                        p_benefit_value

                    else
                        null
                end,

            currency =
                v_currency,

            promotion_code =
                case
                    when p_benefit_type =
                        'promotion_code'
                    then
                        upper(
                            btrim(
                                p_promotion_code
                            )
                        )

                    else
                        null
                end,

            status =
                p_status,

            starts_at =
                p_starts_at,

            ends_at =
                p_ends_at,

            updated_at =
                now()

        where
            id =
                p_partnership_id;


        v_id :=
            p_partnership_id;


        if
            v_current_status <>
                p_status
        then
            insert into
            public.marketplace_partnership_status_history (
                partnership_id,
                from_status,
                to_status,
                note,
                changed_by
            )
            values (
                v_id,
                v_current_status,
                p_status,
                'Statut modifié lors de l''édition',
                auth.uid()
            );
        end if;


        delete from
            public.marketplace_partnership_products

        where
            partnership_id =
                v_id;
    end if;


    insert into
    public.marketplace_partnership_products (
        partnership_id,
        product_id
    )

    select distinct
        v_id,
        product_id

    from
        unnest(
            coalesce(
                p_product_ids,
                array[]::uuid[]
            )
        ) as product_id;


    return v_id;
end;
$$;


-- ============================================================
-- PARTNERSHIP STATUS
-- ============================================================

create or replace function
public.marketplace_set_partnership_status(
    p_partnership_id uuid,
    p_status text,
    p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_seller uuid;

    v_current text;

    v_allowed boolean :=
        false;
begin
    v_seller :=
        public.marketplace_current_seller_organization();


    if p_status not in (
        'active',
        'paused',
        'archived'
    ) then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid partnership status';
    end if;


    select
        status

    into
        v_current

    from
        public.marketplace_partnerships

    where
        id =
            p_partnership_id

        and

        seller_organization_id =
            v_seller

    for update;


    if not found then
        raise exception
            using
                errcode = '42501',
                message =
                    'Partnership access denied';
    end if;


    if v_current =
        'archived'
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Archived partnership cannot be restored';
    end if;


    if v_current =
        p_status
    then
        return p_partnership_id;
    end if;


    v_allowed :=
        (
            v_current =
                'draft'

            and

            p_status in (
                'active',
                'archived'
            )
        )

        or

        (
            v_current =
                'active'

            and

            p_status in (
                'paused',
                'archived'
            )
        )

        or

        (
            v_current =
                'paused'

            and

            p_status in (
                'active',
                'archived'
            )
        );


    if not v_allowed then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid partnership status transition';
    end if;


    update
    public.marketplace_partnerships
    set
        status =
            p_status,

        updated_at =
            now()

    where
        id =
            p_partnership_id;


    insert into
    public.marketplace_partnership_status_history (
        partnership_id,
        from_status,
        to_status,
        note,
        changed_by
    )
    values (
        p_partnership_id,
        v_current,
        p_status,
        nullif(
            btrim(p_note),
            ''
        ),
        auth.uid()
    );


    return p_partnership_id;
end;
$$;


-- ============================================================
-- SELLER SNAPSHOT
-- ============================================================

create or replace function
public.marketplace_promotions_v2_snapshot()
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


            'products',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        product.id,

                                    'name',
                                        product.name,

                                    'price',
                                        product.price,

                                    'listingType',
                                        extension.listing_type,

                                    'status',
                                        extension.status
                                )
                                order by
                                    product.name
                            )

                        from
                            public.products product

                        join
                            public.marketplace_products extension

                          on
                            extension.product_id =
                                product.id

                        where
                            product.seller_id =
                                v_seller

                            and

                            extension.status <>
                                'archived'
                    ),
                    '[]'::jsonb
                ),


            'organizations',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        organization.id,

                                    'name',
                                        organization.name,

                                    'type',
                                        organization.type,

                                    'status',
                                        organization.status
                                )
                                order by
                                    organization.name
                            )

                        from
                            public.organizations organization

                        where
                            organization.id <>
                                v_seller

                            and

                            coalesce(
                                organization.status,
                                'active'
                            ) =
                                'active'
                    ),
                    '[]'::jsonb
                ),


            'bundles',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        bundle.id,

                                    'name',
                                        bundle.name,

                                    'description',
                                        bundle.description,

                                    'pricingMode',
                                        bundle.pricing_mode,

                                    'fixedPrice',
                                        bundle.fixed_price,

                                    'discountPercent',
                                        bundle.discount_percent,

                                    'currency',
                                        bundle.currency,

                                    'status',
                                        bundle.status,

                                    'startsAt',
                                        bundle.starts_at,

                                    'endsAt',
                                        bundle.ends_at,

                                    'originalPrice',
                                        coalesce(
                                            (
                                                select
                                                    sum(
                                                        product.price *
                                                        item.quantity
                                                    )

                                                from
                                                    public.marketplace_bundle_items item

                                                join
                                                    public.products product

                                                  on
                                                    product.id =
                                                        item.product_id

                                                where
                                                    item.bundle_id =
                                                        bundle.id
                                            ),
                                            0
                                        ),

                                    'previewPrice',
                                        case
                                            when
                                                bundle.pricing_mode =
                                                    'fixed_price'
                                            then
                                                bundle.fixed_price

                                            else
                                                round(
                                                    coalesce(
                                                        (
                                                            select
                                                                sum(
                                                                    product.price *
                                                                    item.quantity
                                                                )

                                                            from
                                                                public.marketplace_bundle_items item

                                                            join
                                                                public.products product

                                                              on
                                                                product.id =
                                                                    item.product_id

                                                            where
                                                                item.bundle_id =
                                                                    bundle.id
                                                        ),
                                                        0
                                                    )
                                                    *
                                                    (
                                                        1 -
                                                        bundle.discount_percent /
                                                        100
                                                    ),
                                                    2
                                                )
                                        end,

                                    'items',
                                        coalesce(
                                            (
                                                select
                                                    jsonb_agg(
                                                        jsonb_build_object(
                                                            'productId',
                                                                item.product_id,

                                                            'productName',
                                                                product.name,

                                                            'unitPrice',
                                                                product.price,

                                                            'quantity',
                                                                item.quantity,

                                                            'sortOrder',
                                                                item.sort_order
                                                        )
                                                        order by
                                                            item.sort_order,
                                                            item.created_at
                                                    )

                                                from
                                                    public.marketplace_bundle_items item

                                                join
                                                    public.products product

                                                  on
                                                    product.id =
                                                        item.product_id

                                                where
                                                    item.bundle_id =
                                                        bundle.id
                                            ),
                                            '[]'::jsonb
                                        ),

                                    'createdAt',
                                        bundle.created_at,

                                    'updatedAt',
                                        bundle.updated_at
                                )
                                order by
                                    bundle.created_at desc
                            )

                        from
                            public.marketplace_bundles bundle

                        where
                            bundle.seller_organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'partnerships',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        partnership.id,

                                    'partnerOrganizationId',
                                        partnership.partner_organization_id,

                                    'partnerName',
                                        partnership.partner_name,

                                    'contactName',
                                        partnership.contact_name,

                                    'contactEmail',
                                        partnership.contact_email,

                                    'contactPhone',
                                        partnership.contact_phone,

                                    'partnershipType',
                                        partnership.partnership_type,

                                    'description',
                                        partnership.description,

                                    'benefitType',
                                        partnership.benefit_type,

                                    'benefitValue',
                                        partnership.benefit_value,

                                    'currency',
                                        partnership.currency,

                                    'promotionCode',
                                        partnership.promotion_code,

                                    'status',
                                        partnership.status,

                                    'startsAt',
                                        partnership.starts_at,

                                    'endsAt',
                                        partnership.ends_at,

                                    'productIds',
                                        coalesce(
                                            (
                                                select
                                                    jsonb_agg(
                                                        product_link.product_id
                                                        order by
                                                            product_link.created_at
                                                    )

                                                from
                                                    public.marketplace_partnership_products product_link

                                                where
                                                    product_link.partnership_id =
                                                        partnership.id
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
                                                                history.id,

                                                            'fromStatus',
                                                                history.from_status,

                                                            'toStatus',
                                                                history.to_status,

                                                            'note',
                                                                history.note,

                                                            'createdAt',
                                                                history.created_at
                                                        )
                                                        order by
                                                            history.created_at
                                                    )

                                                from
                                                    public.marketplace_partnership_status_history history

                                                where
                                                    history.partnership_id =
                                                        partnership.id
                                            ),
                                            '[]'::jsonb
                                        ),

                                    'createdAt',
                                        partnership.created_at,

                                    'updatedAt',
                                        partnership.updated_at
                                )
                                order by
                                    partnership.created_at desc
                            )

                        from
                            public.marketplace_partnerships partnership

                        where
                            partnership.seller_organization_id =
                                v_seller
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
public.marketplace_save_bundle(
    uuid,
    text,
    text,
    text,
    numeric,
    numeric,
    text,
    text,
    timestamptz,
    timestamptz,
    jsonb
)
from public, anon;


revoke all
on function
public.marketplace_set_bundle_status(
    uuid,
    text
)
from public, anon;


revoke all
on function
public.marketplace_save_partnership(
    uuid,
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    numeric,
    text,
    text,
    text,
    timestamptz,
    timestamptz,
    uuid[]
)
from public, anon;


revoke all
on function
public.marketplace_set_partnership_status(
    uuid,
    text,
    text
)
from public, anon;


revoke all
on function
public.marketplace_promotions_v2_snapshot()
from public, anon;


grant execute
on function
public.marketplace_save_bundle(
    uuid,
    text,
    text,
    text,
    numeric,
    numeric,
    text,
    text,
    timestamptz,
    timestamptz,
    jsonb
)
to authenticated;


grant execute
on function
public.marketplace_set_bundle_status(
    uuid,
    text
)
to authenticated;


grant execute
on function
public.marketplace_save_partnership(
    uuid,
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    numeric,
    text,
    text,
    text,
    timestamptz,
    timestamptz,
    uuid[]
)
to authenticated;


grant execute
on function
public.marketplace_set_partnership_status(
    uuid,
    text,
    text
)
to authenticated;


grant execute
on function
public.marketplace_promotions_v2_snapshot()
to authenticated;


comment on table
public.marketplace_bundles
is
'Seller bundle configuration authority. V2 does not change products.price and is not consumed by Marketplace checkout.';


comment on table
public.marketplace_partnerships
is
'Seller Marketplace commercial partnership authority. Separate from organizer event sponsorship workflows.';


comment on table
public.marketplace_partnership_status_history
is
'Append-only seller partnership status history.';


commit;