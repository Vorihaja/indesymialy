begin;


-- ============================================================
-- SELLER MANUAL AGENDA AUTHORITY
-- ============================================================

create table
public.seller_agenda_items (
    id uuid primary key
        default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete restrict,

    title text not null,

    description text,

    kind text not null
        default 'task'
        check (
            kind in (
                'task',
                'appointment',
                'operation',
                'note'
            )
        ),

    starts_at timestamptz not null,

    ends_at timestamptz,

    all_day boolean not null
        default false,

    priority text not null
        default 'normal'
        check (
            priority in (
                'low',
                'normal',
                'high',
                'urgent'
            )
        ),

    status text not null
        default 'planned'
        check (
            status in (
                'planned',
                'in_progress',
                'done',
                'cancelled',
                'archived'
            )
        ),

    location text,

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint
    seller_agenda_items_title_not_blank
        check (
            length(
                btrim(title)
            ) > 0
        ),

    constraint
    seller_agenda_items_dates_check
        check (
            ends_at is null
            or ends_at >= starts_at
        )
);


create index
seller_agenda_items_org_date_idx
on public.seller_agenda_items (
    organization_id,
    starts_at,
    status
);


create index
seller_agenda_items_org_status_idx
on public.seller_agenda_items (
    organization_id,
    status,
    updated_at desc
);


alter table
public.seller_agenda_items
enable row level security;


create policy
seller_agenda_items_seller_read
on public.seller_agenda_items
for select
to authenticated
using (
    public.marketplace_can_manage_seller_organization(
        organization_id
    )
);


revoke all
on table
public.seller_agenda_items
from public;


revoke all
on table
public.seller_agenda_items
from anon;


revoke all
on table
public.seller_agenda_items
from authenticated;


grant select
on table
public.seller_agenda_items
to authenticated;


-- ============================================================
-- SAVE MANUAL ITEM
-- ============================================================

create or replace function
public.marketplace_save_seller_agenda_item(
    p_id uuid,
    p_title text,
    p_description text,
    p_kind text,
    p_starts_at timestamptz,
    p_ends_at timestamptz,
    p_all_day boolean,
    p_priority text,
    p_location text,
    p_status text
)
returns uuid

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
    v_id uuid;
begin
    v_seller :=
        public.marketplace_current_seller_organization();


    if v_seller is null then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Seller organization is required';
    end if;


    if
        nullif(
            btrim(
                coalesce(
                    p_title,
                    ''
                )
            ),
            ''
        ) is null
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Agenda title is required';
    end if;


    if p_starts_at is null then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Agenda start is required';
    end if;


    if
        p_ends_at is not null
        and p_ends_at < p_starts_at
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Agenda end must be on or after start';
    end if;


    if
        p_kind not in (
            'task',
            'appointment',
            'operation',
            'note'
        )
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid agenda kind';
    end if;


    if
        p_priority not in (
            'low',
            'normal',
            'high',
            'urgent'
        )
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid agenda priority';
    end if;


    if
        p_status not in (
            'planned',
            'in_progress',
            'done',
            'cancelled',
            'archived'
        )
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid agenda status';
    end if;


    if p_id is null then
        insert into
            public.seller_agenda_items (
                organization_id,
                title,
                description,
                kind,
                starts_at,
                ends_at,
                all_day,
                priority,
                status,
                location,
                created_by
            )

        values (
            v_seller,

            btrim(
                p_title
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

            p_kind,

            p_starts_at,

            p_ends_at,

            coalesce(
                p_all_day,
                false
            ),

            p_priority,

            p_status,

            nullif(
                btrim(
                    coalesce(
                        p_location,
                        ''
                    )
                ),
                ''
            ),

            auth.uid()
        )

        returning
            id

        into
            v_id;
    else
        update
            public.seller_agenda_items

        set
            title =
                btrim(
                    p_title
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

            kind =
                p_kind,

            starts_at =
                p_starts_at,

            ends_at =
                p_ends_at,

            all_day =
                coalesce(
                    p_all_day,
                    false
                ),

            priority =
                p_priority,

            status =
                p_status,

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

            updated_at =
                now()

        where
            id =
                p_id

            and organization_id =
                v_seller

        returning
            id

        into
            v_id;


        if v_id is null then
            raise exception
                using
                    errcode =
                        'P0002',

                    message =
                        'Agenda item not found';
        end if;
    end if;


    return
        v_id;
end;

$function$;


-- ============================================================
-- STATUS WORKFLOW
-- ============================================================

create or replace function
public.marketplace_set_seller_agenda_item_status(
    p_id uuid,
    p_status text
)
returns void

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
begin
    v_seller :=
        public.marketplace_current_seller_organization();


    if v_seller is null then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Seller organization is required';
    end if;


    if
        p_status not in (
            'planned',
            'in_progress',
            'done',
            'cancelled',
            'archived'
        )
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid agenda status';
    end if;


    update
        public.seller_agenda_items

    set
        status =
            p_status,

        updated_at =
            now()

    where
        id =
            p_id

        and organization_id =
            v_seller;


    if not found then
        raise exception
            using
                errcode =
                    'P0002',

                message =
                    'Agenda item not found';
    end if;
end;

$function$;


-- ============================================================
-- TRANSVERSAL READ MODEL
-- ============================================================

create or replace function
public.marketplace_seller_agenda_snapshot(
    p_from timestamptz,
    p_to timestamptz
)
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


    if v_seller is null then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Seller organization is required';
    end if;


    if
        p_from is null
        or p_to is null
        or p_to <= p_from
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid agenda date range';
    end if;


    if
        p_to - p_from >
        interval '730 days'
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Agenda range cannot exceed 730 days';
    end if;


    with raw_items as (

        -- ----------------------------------------------------
        -- Manual seller items
        -- ----------------------------------------------------

        select
            'manual'::text
                as source,

            item.id
                as source_id,

            (
                'manual:' ||
                item.id::text
            )::text
                as stable_id,

            item.title
                as title,

            item.description
                as description,

            item.kind
                as kind,

            item.starts_at
                as starts_at,

            item.ends_at
                as ends_at,

            item.all_day
                as all_day,

            item.priority
                as priority,

            item.status
                as status,

            item.location
                as location,

            true
                as editable,

            null::text
                as related_module,

            null::text
                as related_tab

        from
            public.seller_agenda_items item

        where
            item.organization_id =
                v_seller

            and item.status <>
                'archived'

            and item.starts_at <
                p_to

            and coalesce(
                item.ends_at,
                item.starts_at
            ) >=
                p_from


        union all


        -- ----------------------------------------------------
        -- Promotion periods
        -- ----------------------------------------------------

        select
            'promotion'::text,

            promotion.id,

            (
                'promotion:' ||
                promotion.id::text
            )::text,

            (
                'Promotion · ' ||
                promotion.name
            )::text,

            promotion.description,

            'commercial'::text,

            coalesce(
                promotion.starts_at,
                promotion.ends_at
            ),

            promotion.ends_at,

            false,

            'normal'::text,

            promotion.status,

            null::text,

            false,

            'promotions'::text,

            'Campagnes'::text

        from
            public.marketplace_promotions promotion

        where
            promotion.seller_organization_id =
                v_seller

            and promotion.status <>
                'archived'

            and coalesce(
                promotion.starts_at,
                promotion.ends_at
            ) is not null

            and coalesce(
                promotion.starts_at,
                promotion.ends_at
            ) <
                p_to

            and coalesce(
                promotion.ends_at,
                promotion.starts_at
            ) >=
                p_from


        union all


        -- ----------------------------------------------------
        -- Bundle periods
        -- ----------------------------------------------------

        select
            'bundle'::text,

            bundle.id,

            (
                'bundle:' ||
                bundle.id::text
            )::text,

            (
                'Bundle · ' ||
                bundle.name
            )::text,

            bundle.description,

            'commercial'::text,

            coalesce(
                bundle.starts_at,
                bundle.ends_at
            ),

            bundle.ends_at,

            false,

            'normal'::text,

            bundle.status,

            null::text,

            false,

            'promotions'::text,

            'Bundles'::text

        from
            public.marketplace_bundles bundle

        where
            bundle.seller_organization_id =
                v_seller

            and bundle.status <>
                'archived'

            and coalesce(
                bundle.starts_at,
                bundle.ends_at
            ) is not null

            and coalesce(
                bundle.starts_at,
                bundle.ends_at
            ) <
                p_to

            and coalesce(
                bundle.ends_at,
                bundle.starts_at
            ) >=
                p_from


        union all


        -- ----------------------------------------------------
        -- Partnership periods
        -- ----------------------------------------------------

        select
            'partnership'::text,

            partnership.id,

            (
                'partnership:' ||
                partnership.id::text
            )::text,

            (
                'Partenariat · ' ||
                partnership.partner_name
            )::text,

            partnership.description,

            'commercial'::text,

            coalesce(
                partnership.starts_at,
                partnership.ends_at
            ),

            partnership.ends_at,

            false,

            'normal'::text,

            partnership.status,

            null::text,

            false,

            'promotions'::text,

            'Partenariats'::text

        from
            public.marketplace_partnerships partnership

        where
            partnership.seller_organization_id =
                v_seller

            and partnership.status <>
                'archived'

            and coalesce(
                partnership.starts_at,
                partnership.ends_at
            ) is not null

            and coalesce(
                partnership.starts_at,
                partnership.ends_at
            ) <
                p_to

            and coalesce(
                partnership.ends_at,
                partnership.starts_at
            ) >=
                p_from


        union all


        -- ----------------------------------------------------
        -- Personnel assignments
        -- ----------------------------------------------------

        select
            'personnel_assignment'::text,

            assignment.id,

            (
                'assignment:' ||
                assignment.id::text
            )::text,

            (
                'Affectation · ' ||
                assignment.mission
            )::text,

            assignment.scope,

            'personnel'::text,

            coalesce(
                assignment.starts_at,
                assignment.ends_at
            ),

            assignment.ends_at,

            false,

            'normal'::text,

            assignment.status,

            null::text,

            false,

            'personnel'::text,

            'Affectations'::text

        from
            public.seller_personnel_assignments assignment

        where
            assignment.organization_id =
                v_seller

            and lower(
                coalesce(
                    assignment.status,
                    ''
                )
            ) not in (
                'archived',
                'cancelled',
                'canceled'
            )

            and coalesce(
                assignment.starts_at,
                assignment.ends_at
            ) is not null

            and coalesce(
                assignment.starts_at,
                assignment.ends_at
            ) <
                p_to

            and coalesce(
                assignment.ends_at,
                assignment.starts_at
            ) >=
                p_from


        union all


        -- ----------------------------------------------------
        -- Personnel leaves
        -- ----------------------------------------------------

        select
            'personnel_leave'::text,

            leave_record.id,

            (
                'leave:' ||
                leave_record.id::text
            )::text,

            (
                'Congé · ' ||
                leave_record.leave_type
            )::text,

            null::text,

            'personnel'::text,

            leave_record.starts_on::timestamptz,

            (
                leave_record.ends_on +
                1
            )::timestamptz,

            true,

            'normal'::text,

            leave_record.status,

            null::text,

            false,

            'personnel'::text,

            'Congés'::text

        from
            public.seller_personnel_leaves leave_record

        where
            leave_record.organization_id =
                v_seller

            and lower(
                coalesce(
                    leave_record.status,
                    ''
                )
            ) not in (
                'rejected',
                'cancelled',
                'canceled',
                'archived'
            )

            and leave_record.starts_on::timestamptz <
                p_to

            and (
                leave_record.ends_on +
                1
            )::timestamptz >=
                p_from


        union all


        -- ----------------------------------------------------
        -- Personnel document expiration
        -- ----------------------------------------------------

        select
            'personnel_document'::text,

            document.id,

            (
                'document:' ||
                document.id::text
            )::text,

            (
                'Expiration document · ' ||
                document.name
            )::text,

            null::text,

            'document'::text,

            document.expires_at,

            null::timestamptz,

            false,

            'high'::text,

            document.status,

            null::text,

            false,

            'personnel'::text,

            'Documents'::text

        from
            public.seller_personnel_documents document

        where
            document.organization_id =
                v_seller

            and document.expires_at
                is not null

            and lower(
                coalesce(
                    document.status,
                    ''
                )
            ) <>
                'archived'

            and document.expires_at >=
                p_from

            and document.expires_at <
                p_to
    )

    select
        jsonb_build_object(
            'organizationId',
                v_seller,

            'items',
                coalesce(
                    jsonb_agg(
                        jsonb_build_object(
                            'id',
                                raw_items.stable_id,

                            'source',
                                raw_items.source,

                            'sourceId',
                                raw_items.source_id,

                            'title',
                                raw_items.title,

                            'description',
                                raw_items.description,

                            'kind',
                                raw_items.kind,

                            'startsAt',
                                raw_items.starts_at,

                            'endsAt',
                                raw_items.ends_at,

                            'allDay',
                                raw_items.all_day,

                            'priority',
                                raw_items.priority,

                            'status',
                                raw_items.status,

                            'location',
                                raw_items.location,

                            'editable',
                                raw_items.editable,

                            'relatedModule',
                                raw_items.related_module,

                            'relatedTab',
                                raw_items.related_tab
                        )

                        order by
                            raw_items.starts_at asc,
                            raw_items.title asc
                    ),

                    '[]'::jsonb
                )
        )

    into
        v_result

    from
        raw_items;


    return
        v_result;
end;

$function$;


-- ============================================================
-- PRIVILEGES
-- ============================================================

revoke all
on function
public.marketplace_save_seller_agenda_item(
    uuid,
    text,
    text,
    text,
    timestamptz,
    timestamptz,
    boolean,
    text,
    text,
    text
)
from public;


revoke all
on function
public.marketplace_set_seller_agenda_item_status(
    uuid,
    text
)
from public;


revoke all
on function
public.marketplace_seller_agenda_snapshot(
    timestamptz,
    timestamptz
)
from public;


grant execute
on function
public.marketplace_save_seller_agenda_item(
    uuid,
    text,
    text,
    text,
    timestamptz,
    timestamptz,
    boolean,
    text,
    text,
    text
)
to authenticated;


grant execute
on function
public.marketplace_set_seller_agenda_item_status(
    uuid,
    text
)
to authenticated;


grant execute
on function
public.marketplace_seller_agenda_snapshot(
    timestamptz,
    timestamptz
)
to authenticated;


comment on table
public.seller_agenda_items
is
'Seller-owned manual agenda authority. Derived Marketplace and personnel deadlines remain owned by their source domains.';


comment on function
public.marketplace_seller_agenda_snapshot(
    timestamptz,
    timestamptz
)
is
'Read model aggregating seller manual agenda items and existing real domain dates without duplicating their source authorities.';


commit;