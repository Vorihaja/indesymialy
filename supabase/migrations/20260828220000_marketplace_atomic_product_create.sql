-- ==========================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A4
-- ATOMIC MARKETPLACE PRODUCT CREATION
--
-- products remains the canonical base product.
-- The Marketplace metadata, inventory and images are created
-- in the SAME PostgreSQL transaction.
-- ==========================================================

begin;


create or replace function public.marketplace_create_product(
    p_seller_organization_id uuid,
    p_title text,
    p_description text,
    p_listing_type text,
    p_category text,
    p_sale_price numeric,
    p_rental_price_per_day numeric,
    p_deposit_amount numeric,
    p_stock integer,
    p_condition text,
    p_location text,
    p_status text,
    p_images text[] default '{}'::text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();

    v_product_id uuid;

    v_category_id uuid;

    v_base_price numeric;

    v_image_path text;

    v_image_position integer;
begin

    -- ------------------------------------------------------
    -- AUTHENTICATION
    -- ------------------------------------------------------

    if v_user_id is null then
        raise exception
            using
                errcode = '28000',
                message = 'Authentication required';
    end if;


    -- ------------------------------------------------------
    -- SELLER ORGANIZATION
    -- ------------------------------------------------------

    if p_seller_organization_id is null then
        raise exception
            using
                errcode = '22023',
                message = 'Seller organization is required';
    end if;


    if not exists (
        select 1
        from public.organizations o
        where
            o.id = p_seller_organization_id

            and coalesce(
                o.status,
                'active'
            ) not in (
                'suspended',
                'deleted'
            )

            and (
                o.owner_id = v_user_id

                or exists (
                    select 1
                    from public.organization_members om
                    where
                        om.organization_id =
                            p_seller_organization_id

                        and om.profile_id =
                            v_user_id

                        and om.role in (
                            'owner',
                            'admin',
                            'manager',
                            'seller'
                        )

                        and coalesce(
                            om.status,
                            'active'
                        ) = 'active'
                )
            )
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'You cannot publish products for this organization';

    end if;


    -- ------------------------------------------------------
    -- TITLE
    -- ------------------------------------------------------

    if nullif(
        btrim(
            coalesce(
                p_title,
                ''
            )
        ),
        ''
    ) is null then

        raise exception
            using
                errcode = '22023',
                message = 'Product title is required';

    end if;


    -- ------------------------------------------------------
    -- LISTING TYPE
    -- ------------------------------------------------------

    if p_listing_type not in (
        'sale',
        'rental',
        'used'
    ) then

        raise exception
            using
                errcode = '22023',
                message = 'Invalid Marketplace listing type';

    end if;


    -- ------------------------------------------------------
    -- CONDITION
    -- ------------------------------------------------------

    if p_condition not in (
        'new',
        'excellent',
        'good',
        'used'
    ) then

        raise exception
            using
                errcode = '22023',
                message = 'Invalid product condition';

    end if;


    -- ------------------------------------------------------
    -- STATUS
    -- ------------------------------------------------------

    if p_status not in (
        'draft',
        'published',
        'archived',
        'inactive'
    ) then

        raise exception
            using
                errcode = '22023',
                message = 'Invalid Marketplace product status';

    end if;


    -- ------------------------------------------------------
    -- STOCK
    -- ------------------------------------------------------

    if (
        p_stock is null
        or p_stock < 0
    ) then

        raise exception
            using
                errcode = '22023',
                message = 'Stock must be zero or greater';

    end if;


    -- ------------------------------------------------------
    -- DEPOSIT
    -- ------------------------------------------------------

    if (
        p_deposit_amount is not null
        and p_deposit_amount < 0
    ) then

        raise exception
            using
                errcode = '22023',
                message = 'Deposit amount cannot be negative';

    end if;


    -- ------------------------------------------------------
    -- PRICE
    -- ------------------------------------------------------

    if p_listing_type = 'rental' then

        if (
            p_rental_price_per_day is null
            or p_rental_price_per_day < 0
        ) then

            raise exception
                using
                    errcode = '22023',
                    message =
                        'Rental price per day is required';

        end if;


        v_base_price :=
            p_rental_price_per_day;

    else

        if (
            p_sale_price is null
            or p_sale_price < 0
        ) then

            raise exception
                using
                    errcode = '22023',
                    message =
                        'Sale price is required';

        end if;


        v_base_price :=
            p_sale_price;

    end if;


    -- ------------------------------------------------------
    -- CATEGORY
    --
    -- Accepts either:
    -- - marketplace_categories.name
    -- - marketplace_categories.slug
    -- ------------------------------------------------------

    if nullif(
        btrim(
            coalesce(
                p_category,
                ''
            )
        ),
        ''
    ) is not null then

        select
            mc.id
        into
            v_category_id
        from public.marketplace_categories mc
        where
            mc.is_active = true

            and (
                lower(
                    mc.name
                ) =
                lower(
                    btrim(
                        p_category
                    )
                )

                or

                lower(
                    mc.slug
                ) =
                lower(
                    btrim(
                        p_category
                    )
                )
            )
        order by
            case
                when lower(mc.slug) =
                    lower(
                        btrim(
                            p_category
                        )
                    )
                then 0
                else 1
            end,
            mc.sort_order,
            mc.name
        limit 1;


        if v_category_id is null then

            raise exception
                using
                    errcode = '22023',
                    message =
                        'Marketplace category not found';

        end if;

    end if;


    -- ------------------------------------------------------
    -- 1. CANONICAL PRODUCT
    -- ------------------------------------------------------

    insert into public.products (
        name,
        price,
        seller_id,
        stock
    )
    values (
        btrim(
            p_title
        ),
        v_base_price,
        p_seller_organization_id,
        p_stock
    )
    returning id
    into v_product_id;


    -- ------------------------------------------------------
    -- 2. MARKETPLACE EXTENSION
    -- ------------------------------------------------------

    insert into public.marketplace_products (
        product_id,
        category_id,
        listing_type,
        description,
        rental_price_per_day,
        deposit_amount,
        condition,
        location,
        status,
        published_at
    )
    values (
        v_product_id,
        v_category_id,
        p_listing_type,

        coalesce(
            p_description,
            ''
        ),

        case
            when p_listing_type = 'rental'
                then p_rental_price_per_day
            else null
        end,

        p_deposit_amount,
        p_condition,

        nullif(
            btrim(
                coalesce(
                    p_location,
                    ''
                )
            ),
            ''
        ),

        p_status,

        case
            when p_status = 'published'
                then now()
            else null
        end
    );


    -- ------------------------------------------------------
    -- 3. INVENTORY
    -- ------------------------------------------------------

    insert into public.marketplace_inventory (
        product_id,
        available,
        reserved
    )
    values (
        v_product_id,
        p_stock,
        0
    );


    -- ------------------------------------------------------
    -- 4. IMAGES
    -- ------------------------------------------------------

    if coalesce(
        array_length(
            p_images,
            1
        ),
        0
    ) > 0 then

        for
            v_image_path,
            v_image_position
        in
            select
                image_item.storage_path,
                (
                    image_item.position - 1
                )::integer
            from
                unnest(
                    p_images
                )
                with ordinality
                as image_item(
                    storage_path,
                    position
                )
        loop

            if nullif(
                btrim(
                    coalesce(
                        v_image_path,
                        ''
                    )
                ),
                ''
            ) is null then

                raise exception
                    using
                        errcode = '22023',
                        message =
                            'Marketplace image path cannot be empty';

            end if;


            insert into public.marketplace_product_images (
                product_id,
                storage_path,
                sort_order,
                is_primary
            )
            values (
                v_product_id,
                btrim(
                    v_image_path
                ),
                v_image_position,
                v_image_position = 0
            );

        end loop;

    end if;


    -- ------------------------------------------------------
    -- IMPORTANT
    --
    -- PostgreSQL executes this function inside the caller
    -- transaction.
    --
    -- Any exception above rolls back:
    -- products
    -- marketplace_products
    -- marketplace_inventory
    -- marketplace_product_images
    -- ------------------------------------------------------

    return v_product_id;

end;
$$;


revoke all
on function public.marketplace_create_product(
    uuid,
    text,
    text,
    text,
    text,
    numeric,
    numeric,
    numeric,
    integer,
    text,
    text,
    text,
    text[]
)
from public;


revoke all
on function public.marketplace_create_product(
    uuid,
    text,
    text,
    text,
    text,
    numeric,
    numeric,
    numeric,
    integer,
    text,
    text,
    text,
    text[]
)
from anon;


revoke all
on function public.marketplace_create_product(
    uuid,
    text,
    text,
    text,
    text,
    numeric,
    numeric,
    numeric,
    integer,
    text,
    text,
    text,
    text[]
)
from authenticated;


grant execute
on function public.marketplace_create_product(
    uuid,
    text,
    text,
    text,
    text,
    numeric,
    numeric,
    numeric,
    integer,
    text,
    text,
    text,
    text[]
)
to authenticated;


comment on function public.marketplace_create_product(
    uuid,
    text,
    text,
    text,
    text,
    numeric,
    numeric,
    numeric,
    integer,
    text,
    text,
    text,
    text[]
)
is
'BAZAR-B1-A4-ATOMIC-PRODUCT-CREATE: creates canonical product, Marketplace extension, inventory and images atomically after seller authorization.';


commit;