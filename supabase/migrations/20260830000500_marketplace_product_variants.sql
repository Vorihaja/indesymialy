begin;

create table if not exists public.marketplace_product_variants (
    id uuid primary key default gen_random_uuid(),

    product_id uuid not null
        references public.products(id)
        on delete cascade,

    sku text not null,

    label text not null,

    attributes jsonb not null
        default '{}'::jsonb,

    is_active boolean not null
        default true,

    sort_order integer not null
        default 0,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint marketplace_product_variants_sku_not_blank
        check (length(btrim(sku)) > 0),

    constraint marketplace_product_variants_label_not_blank
        check (length(btrim(label)) > 0),

    constraint marketplace_product_variants_sort_order_non_negative
        check (sort_order >= 0),

    constraint marketplace_product_variants_attributes_object
        check (jsonb_typeof(attributes) = 'object')
);

create unique index if not exists
marketplace_product_variants_product_sku_uidx
on public.marketplace_product_variants (
    product_id,
    lower(btrim(sku))
);

create index if not exists
marketplace_product_variants_product_sort_idx
on public.marketplace_product_variants (
    product_id,
    sort_order,
    created_at
);

create index if not exists
marketplace_product_variants_active_idx
on public.marketplace_product_variants (
    product_id,
    is_active
);

alter table
public.marketplace_product_variants
enable row level security;

drop policy if exists
marketplace_product_variants_seller_read
on public.marketplace_product_variants;

create policy
marketplace_product_variants_seller_read
on public.marketplace_product_variants
for select
to authenticated
using (
    exists (
        select 1
        from public.products product
        left join public.organizations organization
            on organization.id = product.seller_id
        left join public.organization_members membership
            on membership.organization_id = product.seller_id
           and membership.profile_id = auth.uid()
        where
            product.id = product_id
            and (
                organization.owner_id = auth.uid()
                or (
                    membership.profile_id = auth.uid()
                    and membership.role in (
                        'owner',
                        'admin',
                        'manager',
                        'seller'
                    )
                    and coalesce(
                        membership.status,
                        'active'
                    ) = 'active'
                )
            )
    )
);

drop policy if exists
marketplace_product_variants_seller_insert
on public.marketplace_product_variants;

create policy
marketplace_product_variants_seller_insert
on public.marketplace_product_variants
for insert
to authenticated
with check (
    exists (
        select 1
        from public.products product
        left join public.organizations organization
            on organization.id = product.seller_id
        left join public.organization_members membership
            on membership.organization_id = product.seller_id
           and membership.profile_id = auth.uid()
        where
            product.id = product_id
            and (
                organization.owner_id = auth.uid()
                or (
                    membership.profile_id = auth.uid()
                    and membership.role in (
                        'owner',
                        'admin',
                        'manager',
                        'seller'
                    )
                    and coalesce(
                        membership.status,
                        'active'
                    ) = 'active'
                )
            )
    )
);

drop policy if exists
marketplace_product_variants_seller_update
on public.marketplace_product_variants;

create policy
marketplace_product_variants_seller_update
on public.marketplace_product_variants
for update
to authenticated
using (
    exists (
        select 1
        from public.products product
        left join public.organizations organization
            on organization.id = product.seller_id
        left join public.organization_members membership
            on membership.organization_id = product.seller_id
           and membership.profile_id = auth.uid()
        where
            product.id = product_id
            and (
                organization.owner_id = auth.uid()
                or (
                    membership.profile_id = auth.uid()
                    and membership.role in (
                        'owner',
                        'admin',
                        'manager',
                        'seller'
                    )
                    and coalesce(
                        membership.status,
                        'active'
                    ) = 'active'
                )
            )
    )
)
with check (
    exists (
        select 1
        from public.products product
        left join public.organizations organization
            on organization.id = product.seller_id
        left join public.organization_members membership
            on membership.organization_id = product.seller_id
           and membership.profile_id = auth.uid()
        where
            product.id = product_id
            and (
                organization.owner_id = auth.uid()
                or (
                    membership.profile_id = auth.uid()
                    and membership.role in (
                        'owner',
                        'admin',
                        'manager',
                        'seller'
                    )
                    and coalesce(
                        membership.status,
                        'active'
                    ) = 'active'
                )
            )
    )
);

grant
    select,
    insert,
    update
on table
public.marketplace_product_variants
to authenticated;

comment on table
public.marketplace_product_variants
is
'Commercial variants for Marketplace products. No stock or price authority is stored here.';

comment on column
public.marketplace_product_variants.attributes
is
'Free-form variant attributes such as size, color, weight or format.';

commit;