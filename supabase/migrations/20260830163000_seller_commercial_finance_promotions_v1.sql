begin;


-- ============================================================
-- INDESY MIALY
-- SELLER COMMERCIAL + FINANCE + PROMOTIONS V1
--
-- Existing authorities preserved:
--
-- marketplace_transactions
-- marketplace_payments
-- financial_payments
-- financial_entries
--
-- Promotions are configuration only in V1.
-- Checkout integration is intentionally NOT introduced here.
-- ============================================================


-- ============================================================
-- CURRENT SELLER ORGANIZATION
-- ============================================================

create or replace function
public.marketplace_current_seller_organization()
returns uuid

language plpgsql
stable
security definer
set search_path = ''

as $function$

declare
    v_active uuid;
    v_ids uuid[];

begin

    if auth.uid() is null then
        raise exception
            using
                errcode = '28000',
                message =
                    'Authentication required';
    end if;


    select
        active.organization_id

    into
        v_active

    from
        public.active_organizations active

    where
        active.profile_id =
            auth.uid()

        and public.marketplace_can_manage_seller_organization(
            active.organization_id
        )

    limit 1;


    if v_active is not null then
        return
            v_active;
    end if;


    select
        array_agg(
            candidate.id
            order by candidate.id
        )

    into
        v_ids

    from (
        select distinct
            organization.id

        from
            public.organizations organization

        where
            organization.type =
                'seller'

            and public.marketplace_can_manage_seller_organization(
                organization.id
            )
    ) candidate;


    if
        coalesce(
            array_length(
                v_ids,
                1
            ),
            0
        ) = 1
    then
        return
            v_ids[1];
    end if;


    if
        coalesce(
            array_length(
                v_ids,
                1
            ),
            0
        ) > 1
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Multiple seller organizations are available. Activate one organization first.';
    end if;


    raise exception
        using
            errcode = '42501',
            message =
                'No seller organization is available';

end;

$function$;


revoke all
on function
public.marketplace_current_seller_organization()
from public, anon;


grant execute
on function
public.marketplace_current_seller_organization()
to authenticated;



-- ============================================================
-- SELLER TRANSACTION SNAPSHOT
-- ============================================================

create or replace function
public.marketplace_seller_transaction_snapshot(
    p_limit integer default 250
)
returns table (
    transaction_id uuid,
    order_id uuid,
    transaction_type text,
    transaction_status text,
    amount numeric,
    currency text,
    external_reference text,
    created_at timestamptz,

    payment_id uuid,
    payment_method text,
    payment_status text,
    provider_reference text,
    paid_at timestamptz
)

language plpgsql
stable
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    return query

    select
        transaction.id,
        transaction.order_id,
        transaction.transaction_type,
        transaction.status,
        transaction.amount,
        transaction.currency::text,
        transaction.external_reference,
        transaction.created_at,

        payment.id,
        payment.method,
        payment.status,
        payment.provider_reference,
        payment.paid_at

    from
        public.marketplace_transactions transaction

    left join lateral (
        select
            source_payment.id,
            source_payment.method,
            source_payment.status,
            source_payment.provider_reference,
            source_payment.paid_at

        from
            public.marketplace_payments source_payment

        where
            source_payment.transaction_id =
                transaction.id

        order by
            source_payment.created_at desc,
            source_payment.id desc

        limit 1
    ) payment
        on true

    where
        transaction.seller_organization_id =
            v_seller

    order by
        transaction.created_at desc,
        transaction.id desc

    limit
        greatest(
            1,
            least(
                coalesce(
                    p_limit,
                    250
                ),
                500
            )
        );

end;

$function$;


revoke all
on function
public.marketplace_seller_transaction_snapshot(integer)
from public, anon;


grant execute
on function
public.marketplace_seller_transaction_snapshot(integer)
to authenticated;



-- ============================================================
-- SELLER MARKETPLACE LEDGER SNAPSHOT
-- ============================================================

create or replace function
public.marketplace_seller_revenue_snapshot()
returns jsonb

language plpgsql
stable
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
    v_result jsonb;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    with seller_accounts as (
        select
            account.id,
            account.currency_code

        from
            public.financial_accounts account

        where
            account.owner_type =
                'organization'

            and account.organization_id =
                v_seller
    ),

    marketplace_entries as (
        select
            entry.id,
            entry.payment_id,
            entry.entry_type,
            entry.amount,
            entry.currency_code,
            entry.occurred_at,
            entry.description,

            finance_payment.reference,
            finance_payment.source_id,

            marketplace_payment.method
                as payment_method,

            marketplace_payment.provider_reference,

            marketplace_transaction.order_id

        from
            public.financial_entries entry

        join seller_accounts account
            on account.id =
                entry.account_id

        join public.financial_payments finance_payment
            on finance_payment.id =
                entry.payment_id

        left join public.marketplace_payments marketplace_payment
            on marketplace_payment.id =
                finance_payment.source_id

           and finance_payment.source_type =
                'marketplace_payment'

        left join public.marketplace_transactions marketplace_transaction
            on marketplace_transaction.id =
                marketplace_payment.transaction_id

        where
            finance_payment.source_type =
                'marketplace_payment'
    ),

    currency_summary as (
        select
            entry.currency_code,

            coalesce(
                sum(
                    entry.amount
                ) filter (
                    where
                        entry.entry_type =
                            'revenue'
                ),
                0
            ) as revenue,

            coalesce(
                sum(
                    entry.amount
                ) filter (
                    where
                        entry.entry_type =
                            'expense'
                ),
                0
            ) as expense

        from
            marketplace_entries entry

        group by
            entry.currency_code
    ),

    recent_entries as (
        select
            entry.*

        from
            marketplace_entries entry

        order by
            entry.occurred_at desc,
            entry.id desc

        limit 300
    )

    select
        jsonb_build_object(
            'organizationId',
            v_seller,

            'currencies',
            coalesce(
                (
                    select
                        jsonb_agg(
                            jsonb_build_object(
                                'currency',
                                summary.currency_code,

                                'revenue',
                                summary.revenue,

                                'expense',
                                summary.expense,

                                'net',
                                summary.revenue -
                                summary.expense
                            )
                            order by
                                summary.currency_code
                        )

                    from
                        currency_summary summary
                ),
                '[]'::jsonb
            ),

            'entries',
            coalesce(
                (
                    select
                        jsonb_agg(
                            jsonb_build_object(
                                'id',
                                entry.id,

                                'paymentId',
                                entry.payment_id,

                                'entryType',
                                entry.entry_type,

                                'amount',
                                entry.amount,

                                'currency',
                                entry.currency_code,

                                'occurredAt',
                                entry.occurred_at,

                                'description',
                                entry.description,

                                'reference',
                                entry.reference,

                                'sourceId',
                                entry.source_id,

                                'orderId',
                                entry.order_id,

                                'paymentMethod',
                                entry.payment_method,

                                'providerReference',
                                entry.provider_reference
                            )
                            order by
                                entry.occurred_at desc,
                                entry.id desc
                        )

                    from
                        recent_entries entry
                ),
                '[]'::jsonb
            )
        )

    into
        v_result;


    return
        coalesce(
            v_result,
            jsonb_build_object(
                'organizationId',
                v_seller,
                'currencies',
                '[]'::jsonb,
                'entries',
                '[]'::jsonb
            )
        );

end;

$function$;


revoke all
on function
public.marketplace_seller_revenue_snapshot()
from public, anon;


grant execute
on function
public.marketplace_seller_revenue_snapshot()
to authenticated;



-- ============================================================
-- PROMOTIONS
-- ============================================================

create table
public.marketplace_promotions (
    id uuid primary key
        default gen_random_uuid(),

    seller_organization_id uuid not null
        references public.organizations(id)
        on delete restrict,

    name text not null,

    description text,

    discount_type text not null
        check (
            discount_type in (
                'percent',
                'fixed'
            )
        ),

    discount_value numeric(14,2) not null
        check (
            discount_value > 0
        ),

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

    min_order_amount numeric(14,2) not null
        default 0
        check (
            min_order_amount >= 0
        ),

    max_discount_amount numeric(14,2)
        check (
            max_discount_amount is null
            or max_discount_amount > 0
        ),

    usage_limit integer
        check (
            usage_limit is null
            or usage_limit > 0
        ),

    usage_count integer not null
        default 0
        check (
            usage_count >= 0
        ),

    created_by uuid
        references public.profiles(id)
        on delete set null,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    marketplace_promotions_name_not_blank
        check (
            length(
                btrim(
                    name
                )
            ) > 0
        ),

    constraint
    marketplace_promotions_percent_check
        check (
            discount_type <> 'percent'
            or discount_value <= 100
        ),

    constraint
    marketplace_promotions_date_check
        check (
            ends_at is null
            or starts_at is null
            or ends_at > starts_at
        )
);


create index
marketplace_promotions_seller_status_idx
on public.marketplace_promotions (
    seller_organization_id,
    status,
    created_at desc
);


create table
public.marketplace_promotion_products (
    promotion_id uuid not null
        references public.marketplace_promotions(id)
        on delete cascade,

    product_id uuid not null
        references public.products(id)
        on delete cascade,

    created_at timestamptz not null
        default now(),

    primary key (
        promotion_id,
        product_id
    )
);


create index
marketplace_promotion_products_product_idx
on public.marketplace_promotion_products (
    product_id
);


create table
public.marketplace_promotion_codes (
    id uuid primary key
        default gen_random_uuid(),

    promotion_id uuid not null
        references public.marketplace_promotions(id)
        on delete cascade,

    code text not null,

    status text not null
        default 'active'
        check (
            status in (
                'active',
                'inactive'
            )
        ),

    usage_limit integer
        check (
            usage_limit is null
            or usage_limit > 0
        ),

    usage_count integer not null
        default 0
        check (
            usage_count >= 0
        ),

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    marketplace_promotion_codes_not_blank
        check (
            length(
                btrim(
                    code
                )
            ) between 2 and 64
        )
);


create unique index
marketplace_promotion_codes_code_uidx
on public.marketplace_promotion_codes (
    lower(
        btrim(
            code
        )
    )
);


create index
marketplace_promotion_codes_promotion_idx
on public.marketplace_promotion_codes (
    promotion_id,
    status
);


create table
public.marketplace_promotion_redemptions (
    id uuid primary key
        default gen_random_uuid(),

    promotion_id uuid not null
        references public.marketplace_promotions(id)
        on delete restrict,

    promotion_code_id uuid
        references public.marketplace_promotion_codes(id)
        on delete restrict,

    order_id uuid not null
        references public.marketplace_orders(id)
        on delete restrict,

    customer_id uuid not null
        references public.profiles(id)
        on delete restrict,

    discount_amount numeric(14,2) not null
        check (
            discount_amount > 0
        ),

    currency char(3) not null,

    redeemed_at timestamptz not null
        default now(),

    unique (
        order_id,
        promotion_id
    )
);


create index
marketplace_promotion_redemptions_promotion_idx
on public.marketplace_promotion_redemptions (
    promotion_id,
    redeemed_at desc
);



-- ============================================================
-- PROMOTION RLS
-- ============================================================

alter table
public.marketplace_promotions
enable row level security;


alter table
public.marketplace_promotion_products
enable row level security;


alter table
public.marketplace_promotion_codes
enable row level security;


alter table
public.marketplace_promotion_redemptions
enable row level security;


create policy
marketplace_promotions_seller_read
on public.marketplace_promotions
for select
to authenticated
using (
    public.marketplace_can_manage_seller_organization(
        seller_organization_id
    )
);


create policy
marketplace_promotion_products_seller_read
on public.marketplace_promotion_products
for select
to authenticated
using (
    exists (
        select 1

        from
            public.marketplace_promotions promotion

        where
            promotion.id =
                promotion_id

            and public.marketplace_can_manage_seller_organization(
                promotion.seller_organization_id
            )
    )
);


create policy
marketplace_promotion_codes_seller_read
on public.marketplace_promotion_codes
for select
to authenticated
using (
    exists (
        select 1

        from
            public.marketplace_promotions promotion

        where
            promotion.id =
                promotion_id

            and public.marketplace_can_manage_seller_organization(
                promotion.seller_organization_id
            )
    )
);


create policy
marketplace_promotion_redemptions_seller_read
on public.marketplace_promotion_redemptions
for select
to authenticated
using (
    exists (
        select 1

        from
            public.marketplace_promotions promotion

        where
            promotion.id =
                promotion_id

            and public.marketplace_can_manage_seller_organization(
                promotion.seller_organization_id
            )
    )
);


grant select
on table
public.marketplace_promotions
to authenticated;


grant select
on table
public.marketplace_promotion_products
to authenticated;


grant select
on table
public.marketplace_promotion_codes
to authenticated;


grant select
on table
public.marketplace_promotion_redemptions
to authenticated;


revoke
    insert,
    update,
    delete
on table
public.marketplace_promotions
from public, anon, authenticated;


revoke
    insert,
    update,
    delete
on table
public.marketplace_promotion_products
from public, anon, authenticated;


revoke
    insert,
    update,
    delete
on table
public.marketplace_promotion_codes
from public, anon, authenticated;


revoke
    insert,
    update,
    delete
on table
public.marketplace_promotion_redemptions
from public, anon, authenticated;



-- ============================================================
-- SAVE PROMOTION
-- ============================================================

create or replace function
public.marketplace_save_promotion(
    p_promotion_id uuid,

    p_name text,

    p_description text,

    p_discount_type text,

    p_discount_value numeric,

    p_currency text,

    p_status text,

    p_starts_at timestamptz,

    p_ends_at timestamptz,

    p_min_order_amount numeric,

    p_max_discount_amount numeric,

    p_usage_limit integer,

    p_product_ids uuid[]
)
returns uuid

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
    v_id uuid;
    v_product_id uuid;
    v_currency text;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    if
        nullif(
            btrim(
                coalesce(
                    p_name,
                    ''
                )
            ),
            ''
        ) is null
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Promotion name is required';
    end if;


    if
        p_discount_type not in (
            'percent',
            'fixed'
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid promotion discount type';
    end if;


    if
        p_discount_value is null
        or p_discount_value <= 0
        or (
            p_discount_type = 'percent'
            and p_discount_value > 100
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid promotion discount value';
    end if;


    if
        p_status not in (
            'draft',
            'active',
            'paused',
            'archived'
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid promotion status';
    end if;


    if
        p_ends_at is not null
        and p_starts_at is not null
        and p_ends_at <= p_starts_at
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Promotion end date must be after start date';
    end if;


    if
        coalesce(
            p_min_order_amount,
            0
        ) < 0
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Minimum order amount cannot be negative';
    end if;


    if
        p_max_discount_amount is not null
        and p_max_discount_amount <= 0
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Maximum discount must be positive';
    end if;


    if
        p_usage_limit is not null
        and p_usage_limit <= 0
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Usage limit must be positive';
    end if;


    v_currency :=
        upper(
            btrim(
                coalesce(
                    p_currency,
                    'MGA'
                )
            )
        );


    if
        v_currency !~ '^[A-Z]{3}$'
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid currency';
    end if;


    foreach
        v_product_id

    in array
        coalesce(
            p_product_ids,
            array[]::uuid[]
        )

    loop

        if not exists (
            select 1

            from
                public.products product

            where
                product.id =
                    v_product_id

                and product.seller_id =
                    v_seller
        )
        then
            raise exception
                using
                    errcode = '42501',
                    message =
                        'Promotion product does not belong to seller organization';
        end if;

    end loop;


    if
        p_promotion_id is null
    then

        insert into
        public.marketplace_promotions (
            seller_organization_id,
            name,
            description,
            discount_type,
            discount_value,
            currency,
            status,
            starts_at,
            ends_at,
            min_order_amount,
            max_discount_amount,
            usage_limit,
            created_by
        )

        values (
            v_seller,

            btrim(
                p_name
            ),

            nullif(
                btrim(
                    coalesce(
                        p_description,
                        ''
                    )
                ),
                ''
            ),

            p_discount_type,

            p_discount_value,

            v_currency,

            p_status,

            p_starts_at,

            p_ends_at,

            coalesce(
                p_min_order_amount,
                0
            ),

            p_max_discount_amount,

            p_usage_limit,

            auth.uid()
        )

        returning id
        into v_id;

    else

        update
            public.marketplace_promotions

        set
            name =
                btrim(
                    p_name
                ),

            description =
                nullif(
                    btrim(
                        coalesce(
                            p_description,
                            ''
                        )
                    ),
                    ''
                ),

            discount_type =
                p_discount_type,

            discount_value =
                p_discount_value,

            currency =
                v_currency,

            status =
                p_status,

            starts_at =
                p_starts_at,

            ends_at =
                p_ends_at,

            min_order_amount =
                coalesce(
                    p_min_order_amount,
                    0
                ),

            max_discount_amount =
                p_max_discount_amount,

            usage_limit =
                p_usage_limit,

            updated_at =
                now()

        where
            id =
                p_promotion_id

            and seller_organization_id =
                v_seller

        returning id
        into v_id;


        if v_id is null then
            raise exception
                using
                    errcode = 'P0002',
                    message =
                        'Promotion not found';
        end if;

    end if;


    delete from
        public.marketplace_promotion_products

    where
        promotion_id =
            v_id;


    insert into
    public.marketplace_promotion_products (
        promotion_id,
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
        ) product_id;


    return
        v_id;

end;

$function$;



create or replace function
public.marketplace_set_promotion_status(
    p_promotion_id uuid,
    p_status text
)
returns uuid

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
    v_current text;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    if
        p_status not in (
            'draft',
            'active',
            'paused',
            'archived'
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid promotion status';
    end if;


    select
        promotion.status

    into
        v_current

    from
        public.marketplace_promotions promotion

    where
        promotion.id =
            p_promotion_id

        and promotion.seller_organization_id =
            v_seller

    for update;


    if not found then
        raise exception
            using
                errcode = 'P0002',
                message =
                    'Promotion not found';
    end if;


    if
        v_current = 'archived'
        and p_status <> 'archived'
    then
        raise exception
            using
                errcode = '55000',
                message =
                    'Archived promotion cannot be reactivated';
    end if;


    update
        public.marketplace_promotions

    set
        status =
            p_status,

        updated_at =
            now()

    where
        id =
            p_promotion_id;


    return
        p_promotion_id;

end;

$function$;



create or replace function
public.marketplace_save_promotion_code(
    p_code_id uuid,

    p_promotion_id uuid,

    p_code text,

    p_status text,

    p_usage_limit integer
)
returns uuid

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
    v_id uuid;
    v_code text;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    if not exists (
        select 1

        from
            public.marketplace_promotions promotion

        where
            promotion.id =
                p_promotion_id

            and promotion.seller_organization_id =
                v_seller

            and promotion.status <>
                'archived'
    )
    then
        raise exception
            using
                errcode = '42501',
                message =
                    'Promotion unavailable';
    end if;


    v_code :=
        upper(
            btrim(
                coalesce(
                    p_code,
                    ''
                )
            )
        );


    if
        length(
            v_code
        ) < 2
        or length(
            v_code
        ) > 64
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Promotion code must contain between 2 and 64 characters';
    end if;


    if
        p_status not in (
            'active',
            'inactive'
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid promotion code status';
    end if;


    if
        p_usage_limit is not null
        and p_usage_limit <= 0
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Promotion code usage limit must be positive';
    end if;


    if
        p_code_id is null
    then

        insert into
        public.marketplace_promotion_codes (
            promotion_id,
            code,
            status,
            usage_limit
        )

        values (
            p_promotion_id,
            v_code,
            p_status,
            p_usage_limit
        )

        returning id
        into v_id;

    else

        update
            public.marketplace_promotion_codes code

        set
            promotion_id =
                p_promotion_id,

            code =
                v_code,

            status =
                p_status,

            usage_limit =
                p_usage_limit,

            updated_at =
                now()

        from
            public.marketplace_promotions promotion

        where
            code.id =
                p_code_id

            and promotion.id =
                code.promotion_id

            and promotion.seller_organization_id =
                v_seller

        returning code.id
        into v_id;


        if v_id is null then
            raise exception
                using
                    errcode = 'P0002',
                    message =
                        'Promotion code not found';
        end if;

    end if;


    return
        v_id;

end;

$function$;



create or replace function
public.marketplace_set_promotion_code_status(
    p_code_id uuid,
    p_status text
)
returns uuid

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    if
        p_status not in (
            'active',
            'inactive'
        )
    then
        raise exception
            using
                errcode = '22023',
                message =
                    'Invalid promotion code status';
    end if;


    update
        public.marketplace_promotion_codes code

    set
        status =
            p_status,

        updated_at =
            now()

    from
        public.marketplace_promotions promotion

    where
        code.id =
            p_code_id

        and promotion.id =
            code.promotion_id

        and promotion.seller_organization_id =
            v_seller;


    if not found then
        raise exception
            using
                errcode = 'P0002',
                message =
                    'Promotion code not found';
    end if;


    return
        p_code_id;

end;

$function$;



revoke all
on function
public.marketplace_save_promotion(
    uuid,
    text,
    text,
    text,
    numeric,
    text,
    text,
    timestamptz,
    timestamptz,
    numeric,
    numeric,
    integer,
    uuid[]
)
from public, anon;


revoke all
on function
public.marketplace_set_promotion_status(
    uuid,
    text
)
from public, anon;


revoke all
on function
public.marketplace_save_promotion_code(
    uuid,
    uuid,
    text,
    text,
    integer
)
from public, anon;


revoke all
on function
public.marketplace_set_promotion_code_status(
    uuid,
    text
)
from public, anon;


grant execute
on function
public.marketplace_save_promotion(
    uuid,
    text,
    text,
    text,
    numeric,
    text,
    text,
    timestamptz,
    timestamptz,
    numeric,
    numeric,
    integer,
    uuid[]
)
to authenticated;


grant execute
on function
public.marketplace_set_promotion_status(
    uuid,
    text
)
to authenticated;


grant execute
on function
public.marketplace_save_promotion_code(
    uuid,
    uuid,
    text,
    text,
    integer
)
to authenticated;


grant execute
on function
public.marketplace_set_promotion_code_status(
    uuid,
    text
)
to authenticated;


comment on table
public.marketplace_promotions
is
'Seller promotion configuration authority. V1 does not mutate cart or checkout totals.';


comment on table
public.marketplace_promotion_products
is
'Optional product scope for a campaign. No rows means the whole seller catalogue.';


comment on table
public.marketplace_promotion_redemptions
is
'Future checkout redemption ledger. Seller UI cannot write redemptions directly.';


commit;