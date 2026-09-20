-- ==========================================================
-- INDESY MIALY / INDESY BAZAR
-- BAZAR-B1-A5
--
-- ATOMIC MARKETPLACE PRODUCT UPDATE
--
-- Updates in ONE PostgreSQL transaction:
--
-- products
-- marketplace_products
-- marketplace_inventory
-- marketplace_product_images
--
-- Any exception rolls the complete update back.
-- ==========================================================

begin;


create or replace function public.marketplace_update_product(
    p_product_id uuid,
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
    v_user_id uuid :=
        auth.uid();

    v_category_id uuid;

    v_base_price numeric;

    v_image_path text;

    v_image_position integer;

    v_product_seller_id uuid;
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
    -- PRODUCT
    -- ------------------------------------------------------

    if p_product_id is null then

        raise exception
            using
                errcode = '22023',
                message = 'Product id is required';

    end if;


    select
        product.seller_id
    into
        v_product_seller_id
    from public.products product
    where
        product.id = p_product_id
    for update;


    if v_product_seller_id is null then

        raise exception
            using
                errcode = 'P0002',
                message = 'Marketplace product not found';

    end if;


    -- ------------------------------------------------------
    -- SELLER ORGANIZATION
    -- ------------------------------------------------------

    if p_seller_organization_id is null then

        raise exception
            using
                errcode = '22023',
                message =
                    'Seller organization is required';

    end if;


    if (
        v_product_seller_id <>
        p_seller_organization_id
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'This product does not belong to the selected seller organization';

    end if;


    if not exists (
        select 1
        from public.organizations organization
        where
            organization.id =
                p_seller_organization_id

            and coalesce(
                organization.status,
                'active'
            ) not in (
                'suspended',
                'deleted'
            )

            and (
                organization.owner_id =
                    v_user_id

                or exists (
                    select 1
                    from public.organization_members membership
                    where
                        membership.organization_id =
                            p_seller_organization_id

                        and membership.profile_id =
                            v_user_id

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
    ) then

        raise exception
            using
                errcode = '42501',
                message =
                    'You cannot update products for this organization';

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
                message =
                    'Invalid Marketplace listing type';

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
                message =
                    'Invalid product condition';

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
                message =
                    'Invalid Marketplace product status';

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
                message =
                    'Stock must be zero or greater';

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
                message =
                    'Deposit amount cannot be negative';

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
    -- Accepts either category name or slug.
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
            category.id
        into
            v_category_id
        from public.marketplace_categories category
        where
            category.is_active = true

            and (
                lower(
                    category.name
                ) =
                lower(
                    btrim(
                        p_category
                    )
                )

                or

                lower(
                    category.slug
                ) =
                lower(
                    btrim(
                        p_category
                    )
                )
            )
        order by
            case
                when lower(
                    category.slug
                ) =
                lower(
                    btrim(
                        p_category
                    )
                )
                then 0
                else 1
            end,
            category.sort_order,
            category.name
        limit 1;


        if v_category_id is null then

            raise exception
                using
                    errcode = '22023',
                    message =
                        'Marketplace category not found';

        end if;

    end if;


    -- ======================================================
    -- 1. CANONICAL PRODUCT
    -- ======================================================

    update public.products
    set
        name =
            btrim(
                p_title
            ),

        price =
            v_base_price,

        stock =
            p_stock
    where
        id =
            p_product_id;


    if not found then

        raise exception
            using
                errcode = 'P0002',
                message =
                    'Marketplace product not found during update';

    end if;


    -- ======================================================
    -- 2. MARKETPLACE EXTENSION
    -- ======================================================

    update public.marketplace_products
    set
        category_id =
            v_category_id,

        listing_type =
            p_listing_type,

        description =
            coalesce(
                p_description,
                ''
            ),

        rental_price_per_day =
            case
                when p_listing_type = 'rental'
                    then p_rental_price_per_day
                else null
            end,

        deposit_amount =
            p_deposit_amount,

        condition =
            p_condition,

        location =
            nullif(
                btrim(
                    coalesce(
                        p_location,
                        ''
                    )
                ),
                ''
            ),

        status =
            p_status,

        published_at =
            case
                when p_status = 'published'
                    then now()
                else null
            end,

        updated_at =
            now()

    where
        product_id =
            p_product_id;


    if not found then

        raise exception
            using
                errcode = 'P0002',
                message =
                    'Marketplace product extension not found';

    end if;


    -- ======================================================
    -- 3. MARKETPLACE INVENTORY
    -- ======================================================

    update public.marketplace_inventory
    set
        available =
            p_stock
    where
        product_id =
            p_product_id;


    if not found then

        insert into public.marketplace_inventory (
            product_id,
            available,
            reserved
        )
        values (
            p_product_id,
            p_stock,
            0
        );

    end if;


    -- ======================================================
    -- 4. IMAGES
    --
    -- Images are replaced atomically.
    --
    -- If p_images = empty array:
    -- all current product images are removed.
    -- ======================================================

    delete from public.marketplace_product_images
    where
        product_id =
            p_product_id;


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
                p_product_id,

                btrim(
                    v_image_path
                ),

                v_image_position,

                v_image_position = 0
            );

        end loop;

    end if;


    -- ------------------------------------------------------
    -- Any exception above automatically rolls back:
    --
    -- products
    -- marketplace_products
    -- marketplace_inventory
    -- marketplace_product_images
    -- ------------------------------------------------------

    return p_product_id;

end;
$$;


revoke all
on function public.marketplace_update_product(
    uuid,
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
on function public.marketplace_update_product(
    uuid,
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
on function public.marketplace_update_product(
    uuid,
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
on function public.marketplace_update_product(
    uuid,
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


comment on function public.marketplace_update_product(
    uuid,
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
'BAZAR-B1-A5-ATOMIC-PRODUCT-UPDATE: atomically updates canonical product, Marketplace extension, inventory and images after seller authorization.';


commit;