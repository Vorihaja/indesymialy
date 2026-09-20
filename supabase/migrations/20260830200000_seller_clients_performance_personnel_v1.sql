begin;

-- ============================================================
-- INDESY MIALY
-- SELLER ERP
-- CLIENTS + PERFORMANCE + PERSONNEL V1
--
-- Principes :
--
-- - marketplace_orders reste l'autorité commerciale client.
-- - products.price n'est jamais modifié.
-- - marketplace_inventory reste l'autorité stock.
-- - financial_entries reste l'autorité comptable.
-- - organization_members reste l'autorité d'appartenance.
-- - organization_invitations reste l'autorité d'invitation.
-- - organization_internal_roles reste l'autorité des rôles internes.
--
-- Les nouvelles tables ne stockent que les extensions métier
-- inexistantes dans les autorités actuelles.
-- ============================================================


-- ============================================================
-- CLIENT CRM EXTENSIONS
-- ============================================================

create table if not exists
public.marketplace_customer_segments (
    id uuid primary key default gen_random_uuid(),

    seller_organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    name text not null,

    description text,

    status text not null default 'active'
        check (
            status in (
                'active',
                'archived'
            )
        ),

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint marketplace_customer_segments_name_not_blank
        check (
            length(
                btrim(name)
            ) > 0
        )
);


create unique index if not exists
marketplace_customer_segments_seller_name_uidx
on public.marketplace_customer_segments (
    seller_organization_id,
    lower(
        btrim(name)
    )
)
where status <> 'archived';


create table if not exists
public.marketplace_customer_segment_members (
    segment_id uuid not null
        references public.marketplace_customer_segments(id)
        on delete cascade,

    customer_id uuid not null
        references public.profiles(id)
        on delete cascade,

    added_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null default now(),

    primary key (
        segment_id,
        customer_id
    )
);


create table if not exists
public.marketplace_customer_loyalty_ledger (
    id uuid primary key default gen_random_uuid(),

    seller_organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    customer_id uuid not null
        references public.profiles(id)
        on delete restrict,

    points_delta integer not null
        check (
            points_delta <> 0
        ),

    reason text not null,

    order_id uuid
        references public.marketplace_orders(id)
        on delete set null,

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null default now(),

    constraint marketplace_customer_loyalty_reason_not_blank
        check (
            length(
                btrim(reason)
            ) > 0
        )
);


create index if not exists
marketplace_customer_loyalty_customer_idx
on public.marketplace_customer_loyalty_ledger (
    seller_organization_id,
    customer_id,
    created_at desc
);


create table if not exists
public.marketplace_customer_disputes (
    id uuid primary key default gen_random_uuid(),

    seller_organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    customer_id uuid not null
        references public.profiles(id)
        on delete restrict,

    order_id uuid
        references public.marketplace_orders(id)
        on delete set null,

    subject text not null,

    description text,

    status text not null default 'open'
        check (
            status in (
                'open',
                'in_review',
                'resolved',
                'closed'
            )
        ),

    resolution text,

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    resolved_at timestamptz,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint marketplace_customer_disputes_subject_not_blank
        check (
            length(
                btrim(subject)
            ) > 0
        )
);


create index if not exists
marketplace_customer_disputes_seller_status_idx
on public.marketplace_customer_disputes (
    seller_organization_id,
    status,
    created_at desc
);


-- ============================================================
-- SELLER PERSONNEL EXTENSIONS
--
-- organization_members reste l'autorité d'accès.
-- ============================================================

create table if not exists
public.seller_personnel_profiles (
    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    profile_id uuid not null
        references public.profiles(id)
        on delete cascade,

    department text,

    contract_type text,

    location text,

    availability text,

    employment_status text not null default 'active'
        check (
            employment_status in (
                'active',
                'on_leave',
                'inactive'
            )
        ),

    monthly_compensation numeric(14,2)
        check (
            monthly_compensation is null
            or monthly_compensation >= 0
        ),

    currency_code char(3) not null default 'MGA',

    updated_by uuid
        references public.profiles(id)
        on delete set null,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    primary key (
        organization_id,
        profile_id
    ),

    constraint seller_personnel_profiles_currency_check
        check (
            currency_code ~ '^[A-Z]{3}$'
        )
);


create table if not exists
public.seller_personnel_assignments (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    profile_id uuid not null
        references public.profiles(id)
        on delete cascade,

    mission text not null,

    scope text,

    starts_at timestamptz,

    ends_at timestamptz,

    status text not null default 'planned'
        check (
            status in (
                'planned',
                'in_progress',
                'completed',
                'cancelled'
            )
        ),

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint seller_personnel_assignments_mission_not_blank
        check (
            length(
                btrim(mission)
            ) > 0
        ),

    constraint seller_personnel_assignments_dates_check
        check (
            ends_at is null
            or starts_at is null
            or ends_at > starts_at
        )
);


create index if not exists
seller_personnel_assignments_org_date_idx
on public.seller_personnel_assignments (
    organization_id,
    starts_at desc
);


create table if not exists
public.seller_personnel_attendance (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    profile_id uuid not null
        references public.profiles(id)
        on delete cascade,

    work_date date not null,

    check_in_at timestamptz,

    check_out_at timestamptz,

    note text,

    recorded_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    unique (
        organization_id,
        profile_id,
        work_date
    ),

    constraint seller_personnel_attendance_times_check
        check (
            check_out_at is null
            or check_in_at is null
            or check_out_at >= check_in_at
        )
);


create table if not exists
public.seller_personnel_leaves (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    profile_id uuid not null
        references public.profiles(id)
        on delete cascade,

    leave_type text not null,

    starts_on date not null,

    ends_on date not null,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'approved',
                'declined',
                'cancelled'
            )
        ),

    decision_by uuid
        references public.profiles(id)
        on delete set null,

    decision_at timestamptz,

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint seller_personnel_leaves_type_not_blank
        check (
            length(
                btrim(leave_type)
            ) > 0
        ),

    constraint seller_personnel_leaves_dates_check
        check (
            ends_on >= starts_on
        )
);


create index if not exists
seller_personnel_leaves_org_status_idx
on public.seller_personnel_leaves (
    organization_id,
    status,
    starts_on desc
);


create table if not exists
public.seller_personnel_documents (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    profile_id uuid not null
        references public.profiles(id)
        on delete cascade,

    name text not null,

    category text not null,

    storage_path text not null,

    file_name text not null,

    mime_type text,

    expires_at date,

    status text not null default 'active'
        check (
            status in (
                'active',
                'archived'
            )
        ),

    created_by uuid not null
        references public.profiles(id)
        on delete restrict,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint seller_personnel_documents_name_not_blank
        check (
            length(
                btrim(name)
            ) > 0
        )
);


create index if not exists
seller_personnel_documents_org_profile_idx
on public.seller_personnel_documents (
    organization_id,
    profile_id,
    created_at desc
);


-- ============================================================
-- PERSONNEL PERMISSION
-- ============================================================

create or replace function
public.marketplace_can_manage_seller_personnel(
    p_organization_id uuid
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
            select
                1

            from
                public.organizations organization

            where
                organization.id =
                    p_organization_id

                and organization.type =
                    'seller'

                and (
                    organization.owner_id =
                        auth.uid()

                    or exists (
                        select
                            1

                        from
                            public.organization_members membership

                        where
                            membership.organization_id =
                                organization.id

                            and membership.profile_id =
                                auth.uid()

                            and membership.role in (
                                'owner',
                                'admin',
                                'manager'
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
public.marketplace_can_manage_seller_personnel(uuid)
from public, anon;


grant execute
on function
public.marketplace_can_manage_seller_personnel(uuid)
to authenticated;


-- ============================================================
-- RLS
-- ============================================================

alter table
public.marketplace_customer_segments
enable row level security;

alter table
public.marketplace_customer_segment_members
enable row level security;

alter table
public.marketplace_customer_loyalty_ledger
enable row level security;

alter table
public.marketplace_customer_disputes
enable row level security;

alter table
public.seller_personnel_profiles
enable row level security;

alter table
public.seller_personnel_assignments
enable row level security;

alter table
public.seller_personnel_attendance
enable row level security;

alter table
public.seller_personnel_leaves
enable row level security;

alter table
public.seller_personnel_documents
enable row level security;


drop policy if exists
marketplace_customer_segments_seller_read
on public.marketplace_customer_segments;

create policy
marketplace_customer_segments_seller_read
on public.marketplace_customer_segments
for select
to authenticated
using (
    public.marketplace_can_manage_seller_organization(
        seller_organization_id
    )
);


drop policy if exists
marketplace_customer_segment_members_seller_read
on public.marketplace_customer_segment_members;

create policy
marketplace_customer_segment_members_seller_read
on public.marketplace_customer_segment_members
for select
to authenticated
using (
    exists (
        select
            1

        from
            public.marketplace_customer_segments segment

        where
            segment.id =
                segment_id

            and public.marketplace_can_manage_seller_organization(
                segment.seller_organization_id
            )
    )
);


drop policy if exists
marketplace_customer_loyalty_seller_read
on public.marketplace_customer_loyalty_ledger;

create policy
marketplace_customer_loyalty_seller_read
on public.marketplace_customer_loyalty_ledger
for select
to authenticated
using (
    public.marketplace_can_manage_seller_organization(
        seller_organization_id
    )
);


drop policy if exists
marketplace_customer_disputes_seller_read
on public.marketplace_customer_disputes;

create policy
marketplace_customer_disputes_seller_read
on public.marketplace_customer_disputes
for select
to authenticated
using (
    public.marketplace_can_manage_seller_organization(
        seller_organization_id
    )
);


drop policy if exists
seller_personnel_profiles_manager_read
on public.seller_personnel_profiles;

create policy
seller_personnel_profiles_manager_read
on public.seller_personnel_profiles
for select
to authenticated
using (
    public.marketplace_can_manage_seller_personnel(
        organization_id
    )
);


drop policy if exists
seller_personnel_assignments_manager_read
on public.seller_personnel_assignments;

create policy
seller_personnel_assignments_manager_read
on public.seller_personnel_assignments
for select
to authenticated
using (
    public.marketplace_can_manage_seller_personnel(
        organization_id
    )
);


drop policy if exists
seller_personnel_attendance_manager_read
on public.seller_personnel_attendance;

create policy
seller_personnel_attendance_manager_read
on public.seller_personnel_attendance
for select
to authenticated
using (
    public.marketplace_can_manage_seller_personnel(
        organization_id
    )
);


drop policy if exists
seller_personnel_leaves_manager_read
on public.seller_personnel_leaves;

create policy
seller_personnel_leaves_manager_read
on public.seller_personnel_leaves
for select
to authenticated
using (
    public.marketplace_can_manage_seller_personnel(
        organization_id
    )
);


drop policy if exists
seller_personnel_documents_manager_read
on public.seller_personnel_documents;

create policy
seller_personnel_documents_manager_read
on public.seller_personnel_documents
for select
to authenticated
using (
    public.marketplace_can_manage_seller_personnel(
        organization_id
    )
);


grant select
on table
public.marketplace_customer_segments,
public.marketplace_customer_segment_members,
public.marketplace_customer_loyalty_ledger,
public.marketplace_customer_disputes,
public.seller_personnel_profiles,
public.seller_personnel_assignments,
public.seller_personnel_attendance,
public.seller_personnel_leaves,
public.seller_personnel_documents
to authenticated;


revoke insert, update, delete
on table
public.marketplace_customer_segments,
public.marketplace_customer_segment_members,
public.marketplace_customer_loyalty_ledger,
public.marketplace_customer_disputes,
public.seller_personnel_profiles,
public.seller_personnel_assignments,
public.seller_personnel_attendance,
public.seller_personnel_leaves,
public.seller_personnel_documents
from authenticated;


-- ============================================================
-- CLIENT SNAPSHOT
-- ============================================================

create or replace function
public.marketplace_seller_customers_snapshot()
returns jsonb

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


    return
        jsonb_build_object(

            'organizationId',
                v_seller,


            'customers',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        customer.customer_id,

                                    'name',
                                        customer.customer_name,

                                    'email',
                                        customer.customer_email,

                                    'phone',
                                        customer.customer_phone,

                                    'firstOrderAt',
                                        customer.first_order_at,

                                    'lastOrderAt',
                                        customer.last_order_at,

                                    'orders',
                                        customer.orders,

                                    'paidOrders',
                                        customer.paid_orders,

                                    'loyaltyPoints',
                                        coalesce(
                                            (
                                                select
                                                    sum(
                                                        loyalty.points_delta
                                                    )

                                                from
                                                    public.marketplace_customer_loyalty_ledger loyalty

                                                where
                                                    loyalty.seller_organization_id =
                                                        v_seller

                                                    and loyalty.customer_id =
                                                        customer.customer_id
                                            ),
                                            0
                                        ),

                                    'segmentIds',
                                        coalesce(
                                            (
                                                select
                                                    jsonb_agg(
                                                        member.segment_id
                                                    )

                                                from
                                                    public.marketplace_customer_segment_members member

                                                join
                                                    public.marketplace_customer_segments segment
                                                  on segment.id =
                                                     member.segment_id

                                                where
                                                    segment.seller_organization_id =
                                                        v_seller

                                                    and member.customer_id =
                                                        customer.customer_id

                                                    and segment.status =
                                                        'active'
                                            ),
                                            '[]'::jsonb
                                        ),

                                    'totalsByCurrency',
                                        coalesce(
                                            (
                                                select
                                                    jsonb_agg(
                                                        jsonb_build_object(
                                                            'currency',
                                                                totals.currency,

                                                            'orders',
                                                                totals.orders,

                                                            'paidOrders',
                                                                totals.paid_orders,

                                                            'paidSubtotal',
                                                                totals.paid_subtotal,

                                                            'paidTotal',
                                                                totals.paid_total
                                                        )

                                                        order by
                                                            totals.currency
                                                    )

                                                from (
                                                    select
                                                        orders.currency::text as currency,

                                                        count(*)::integer as orders,

                                                        count(*) filter (
                                                            where
                                                                orders.payment_status =
                                                                    'paid'
                                                        )::integer as paid_orders,

                                                        coalesce(
                                                            sum(
                                                                orders.subtotal
                                                            ) filter (
                                                                where
                                                                    orders.payment_status =
                                                                        'paid'
                                                            ),
                                                            0
                                                        )::numeric as paid_subtotal,

                                                        coalesce(
                                                            sum(
                                                                orders.total
                                                            ) filter (
                                                                where
                                                                    orders.payment_status =
                                                                        'paid'
                                                            ),
                                                            0
                                                        )::numeric as paid_total

                                                    from
                                                        public.marketplace_orders orders

                                                    where
                                                        orders.seller_organization_id =
                                                            v_seller

                                                        and orders.customer_id =
                                                            customer.customer_id

                                                    group by
                                                        orders.currency
                                                ) totals
                                            ),
                                            '[]'::jsonb
                                        )
                                )

                                order by
                                    customer.last_order_at desc
                            )

                        from (
                            select
                                orders.customer_id,

                                (
                                    array_agg(
                                        orders.customer_name
                                        order by
                                            orders.created_at desc
                                    )
                                )[1] as customer_name,

                                (
                                    array_agg(
                                        orders.customer_email
                                        order by
                                            orders.created_at desc
                                    )
                                )[1] as customer_email,

                                (
                                    array_agg(
                                        orders.customer_phone
                                        order by
                                            orders.created_at desc
                                    )
                                )[1] as customer_phone,

                                min(
                                    orders.created_at
                                ) as first_order_at,

                                max(
                                    orders.created_at
                                ) as last_order_at,

                                count(*)::integer as orders,

                                count(*) filter (
                                    where
                                        orders.payment_status =
                                            'paid'
                                )::integer as paid_orders

                            from
                                public.marketplace_orders orders

                            where
                                orders.seller_organization_id =
                                    v_seller

                            group by
                                orders.customer_id
                        ) customer
                    ),
                    '[]'::jsonb
                ),


            'segments',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        segment.id,

                                    'name',
                                        segment.name,

                                    'description',
                                        segment.description,

                                    'status',
                                        segment.status,

                                    'customerIds',
                                        coalesce(
                                            (
                                                select
                                                    jsonb_agg(
                                                        member.customer_id
                                                    )

                                                from
                                                    public.marketplace_customer_segment_members member

                                                where
                                                    member.segment_id =
                                                        segment.id
                                            ),
                                            '[]'::jsonb
                                        ),

                                    'createdAt',
                                        segment.created_at
                                )

                                order by
                                    segment.created_at desc
                            )

                        from
                            public.marketplace_customer_segments segment

                        where
                            segment.seller_organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'loyalty',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        loyalty.id,

                                    'customerId',
                                        loyalty.customer_id,

                                    'points',
                                        loyalty.points_delta,

                                    'reason',
                                        loyalty.reason,

                                    'orderId',
                                        loyalty.order_id,

                                    'createdAt',
                                        loyalty.created_at
                                )

                                order by
                                    loyalty.created_at desc
                            )

                        from (
                            select
                                *

                            from
                                public.marketplace_customer_loyalty_ledger

                            where
                                seller_organization_id =
                                    v_seller

                            order by
                                created_at desc

                            limit 250
                        ) loyalty
                    ),
                    '[]'::jsonb
                ),


            'disputes',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        dispute.id,

                                    'customerId',
                                        dispute.customer_id,

                                    'orderId',
                                        dispute.order_id,

                                    'subject',
                                        dispute.subject,

                                    'description',
                                        dispute.description,

                                    'status',
                                        dispute.status,

                                    'resolution',
                                        dispute.resolution,

                                    'createdAt',
                                        dispute.created_at,

                                    'updatedAt',
                                        dispute.updated_at
                                )

                                order by
                                    dispute.created_at desc
                            )

                        from
                            public.marketplace_customer_disputes dispute

                        where
                            dispute.seller_organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'recentOrders',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        recent.id,

                                    'customerId',
                                        recent.customer_id,

                                    'status',
                                        recent.status,

                                    'paymentStatus',
                                        recent.payment_status,

                                    'total',
                                        recent.total,

                                    'currency',
                                        recent.currency::text,

                                    'createdAt',
                                        recent.created_at
                                )

                                order by
                                    recent.created_at desc
                            )

                        from (
                            select
                                *

                            from
                                public.marketplace_orders

                            where
                                seller_organization_id =
                                    v_seller

                            order by
                                created_at desc

                            limit 150
                        ) recent
                    ),
                    '[]'::jsonb
                )
        );

end;

$function$;


-- ============================================================
-- CLIENT MUTATIONS
-- ============================================================

create or replace function
public.marketplace_save_customer_segment(
    p_id uuid,
    p_name text,
    p_description text default null
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


    if nullif(
        btrim(
            coalesce(
                p_name,
                ''
            )
        ),
        ''
    ) is null then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Segment name is required';
    end if;


    if p_id is null then

        insert into
            public.marketplace_customer_segments (
                seller_organization_id,
                name,
                description,
                created_by
            )

        values (
            v_seller,
            btrim(p_name),
            nullif(
                btrim(
                    coalesce(
                        p_description,
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
            public.marketplace_customer_segments

        set
            name =
                btrim(p_name),

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

            updated_at =
                now()

        where
            id =
                p_id

            and seller_organization_id =
                v_seller

        returning
            id
        into
            v_id;


        if v_id is null then
            raise exception
                using
                    errcode =
                        '42501',

                    message =
                        'Segment not found';
        end if;

    end if;


    return
        v_id;

end;

$function$;


create or replace function
public.marketplace_set_customer_segment_status(
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


    if p_status not in (
        'active',
        'archived'
    ) then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid segment status';
    end if;


    update
        public.marketplace_customer_segments

    set
        status =
            p_status,

        updated_at =
            now()

    where
        id =
            p_id

        and seller_organization_id =
            v_seller;


    if not found then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Segment not found';
    end if;

end;

$function$;


create or replace function
public.marketplace_set_customer_segment_members(
    p_segment_id uuid,
    p_customer_ids uuid[]
)
returns integer

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
    v_customer uuid;
    v_count integer := 0;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    if not exists (
        select
            1

        from
            public.marketplace_customer_segments segment

        where
            segment.id =
                p_segment_id

            and segment.seller_organization_id =
                v_seller

            and segment.status =
                'active'
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Segment not found';
    end if;


    delete from
        public.marketplace_customer_segment_members

    where
        segment_id =
            p_segment_id;


    foreach
        v_customer
    in array
        coalesce(
            p_customer_ids,
            '{}'::uuid[]
        )

    loop

        if exists (
            select
                1

            from
                public.marketplace_orders orders

            where
                orders.seller_organization_id =
                    v_seller

                and orders.customer_id =
                    v_customer
        ) then

            insert into
                public.marketplace_customer_segment_members (
                    segment_id,
                    customer_id,
                    added_by
                )

            values (
                p_segment_id,
                v_customer,
                auth.uid()
            )

            on conflict do nothing;


            v_count :=
                v_count +
                1;

        end if;

    end loop;


    return
        v_count;

end;

$function$;


create or replace function
public.marketplace_adjust_customer_loyalty(
    p_customer_id uuid,
    p_points integer,
    p_reason text,
    p_order_id uuid default null
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


    if p_points is null
       or p_points = 0 then

        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Points adjustment cannot be zero';
    end if;


    if nullif(
        btrim(
            coalesce(
                p_reason,
                ''
            )
        ),
        ''
    ) is null then

        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Reason is required';
    end if;


    if not exists (
        select
            1

        from
            public.marketplace_orders orders

        where
            orders.seller_organization_id =
                v_seller

            and orders.customer_id =
                p_customer_id
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Customer does not belong to this seller';
    end if;


    if
        p_order_id is not null
        and not exists (
            select
                1

            from
                public.marketplace_orders orders

            where
                orders.id =
                    p_order_id

                and orders.seller_organization_id =
                    v_seller

                and orders.customer_id =
                    p_customer_id
        )
    then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Order does not belong to this customer';
    end if;


    insert into
        public.marketplace_customer_loyalty_ledger (
            seller_organization_id,
            customer_id,
            points_delta,
            reason,
            order_id,
            created_by
        )

    values (
        v_seller,
        p_customer_id,
        p_points,
        btrim(p_reason),
        p_order_id,
        auth.uid()
    )

    returning
        id
    into
        v_id;


    return
        v_id;

end;

$function$;


create or replace function
public.marketplace_save_customer_dispute(
    p_id uuid,
    p_customer_id uuid,
    p_order_id uuid,
    p_subject text,
    p_description text,
    p_status text default 'open',
    p_resolution text default null
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


    if p_status not in (
        'open',
        'in_review',
        'resolved',
        'closed'
    ) then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid dispute status';
    end if;


    if nullif(
        btrim(
            coalesce(
                p_subject,
                ''
            )
        ),
        ''
    ) is null then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Dispute subject is required';
    end if;


    if not exists (
        select
            1

        from
            public.marketplace_orders orders

        where
            orders.seller_organization_id =
                v_seller

            and orders.customer_id =
                p_customer_id
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Customer does not belong to this seller';
    end if;


    if
        p_order_id is not null
        and not exists (
            select
                1

            from
                public.marketplace_orders orders

            where
                orders.id =
                    p_order_id

                and orders.seller_organization_id =
                    v_seller

                and orders.customer_id =
                    p_customer_id
        )
    then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Order does not belong to this customer';
    end if;


    if p_id is null then

        insert into
            public.marketplace_customer_disputes (
                seller_organization_id,
                customer_id,
                order_id,
                subject,
                description,
                status,
                resolution,
                created_by,
                resolved_at
            )

        values (
            v_seller,
            p_customer_id,
            p_order_id,
            btrim(p_subject),
            nullif(
                btrim(
                    coalesce(
                        p_description,
                        ''
                    )
                ),
                ''
            ),
            p_status,
            nullif(
                btrim(
                    coalesce(
                        p_resolution,
                        ''
                    )
                ),
                ''
            ),
            auth.uid(),
            case
                when p_status in (
                    'resolved',
                    'closed'
                )
                then now()
                else null
            end
        )

        returning
            id
        into
            v_id;

    else

        update
            public.marketplace_customer_disputes

        set
            customer_id =
                p_customer_id,

            order_id =
                p_order_id,

            subject =
                btrim(p_subject),

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

            status =
                p_status,

            resolution =
                nullif(
                    btrim(
                        coalesce(
                            p_resolution,
                            ''
                        )
                    ),
                    ''
                ),

            resolved_at =
                case
                    when p_status in (
                        'resolved',
                        'closed'
                    )
                    then
                        coalesce(
                            resolved_at,
                            now()
                        )
                    else
                        null
                end,

            updated_at =
                now()

        where
            id =
                p_id

            and seller_organization_id =
                v_seller

        returning
            id
        into
            v_id;


        if v_id is null then
            raise exception
                using
                    errcode =
                        '42501',

                    message =
                        'Dispute not found';
        end if;

    end if;


    return
        v_id;

end;

$function$;


-- ============================================================
-- SELLER PERFORMANCE
-- ============================================================

create or replace function
public.marketplace_seller_performance_snapshot(
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

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    if p_from is null
       or p_to is null
       or p_to <= p_from then

        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid performance period';
    end if;


    return (
        with
        seller_orders as (
            select
                orders.*

            from
                public.marketplace_orders orders

            where
                orders.seller_organization_id =
                    v_seller

                and orders.created_at >=
                    p_from

                and orders.created_at <
                    p_to
        ),

        paid_orders as (
            select
                *

            from
                seller_orders

            where
                payment_status =
                    'paid'
        ),

        currency_totals as (
            select
                currency::text as currency,

                count(*)::integer as orders,

                coalesce(
                    sum(subtotal),
                    0
                )::numeric as subtotal,

                coalesce(
                    sum(total),
                    0
                )::numeric as total,

                coalesce(
                    avg(total),
                    0
                )::numeric as average_order

            from
                paid_orders

            group by
                currency
        ),

        product_currency as (
            select
                line.product_id,

                orders.currency::text as currency,

                count(
                    distinct orders.id
                )::integer as orders,

                sum(
                    line.quantity
                )::integer as units,

                coalesce(
                    sum(
                        line.line_total
                    ),
                    0
                )::numeric as revenue

            from
                public.marketplace_order_lines line

            join
                paid_orders orders
              on orders.id =
                 line.order_id

            group by
                line.product_id,
                orders.currency
        ),

        product_amounts as (
            select
                product_id,

                jsonb_agg(
                    jsonb_build_object(
                        'currency',
                            currency,

                        'orders',
                            orders,

                        'units',
                            units,

                        'revenue',
                            revenue
                    )

                    order by
                        currency
                ) as amounts

            from
                product_currency

            group by
                product_id
        ),

        product_totals as (
            select
                line.product_id,

                max(
                    line.product_title
                ) as product_title,

                count(
                    distinct orders.id
                )::integer as orders,

                sum(
                    line.quantity
                )::integer as units

            from
                public.marketplace_order_lines line

            join
                paid_orders orders
              on orders.id =
                 line.order_id

            group by
                line.product_id
        ),

        customer_currency as (
            select
                orders.customer_id,

                orders.currency::text as currency,

                count(*)::integer as orders,

                coalesce(
                    sum(
                        orders.total
                    ),
                    0
                )::numeric as revenue

            from
                paid_orders orders

            group by
                orders.customer_id,
                orders.currency
        ),

        customer_amounts as (
            select
                customer_id,

                jsonb_agg(
                    jsonb_build_object(
                        'currency',
                            currency,

                        'orders',
                            orders,

                        'revenue',
                            revenue
                    )

                    order by
                        currency
                ) as amounts

            from
                customer_currency

            group by
                customer_id
        ),

        customer_totals as (
            select
                orders.customer_id,

                (
                    array_agg(
                        orders.customer_name
                        order by
                            orders.created_at desc
                    )
                )[1] as customer_name,

                count(*)::integer as orders

            from
                paid_orders orders

            group by
                orders.customer_id
        ),

        seller_carts as (
            select
                distinct
                cart.id,
                cart.status,
                cart.created_at

            from
                public.marketplace_carts cart

            join
                public.marketplace_cart_items item
              on item.cart_id =
                 cart.id

            join
                public.products product
              on product.id =
                 item.product_id

            where
                product.seller_id =
                    v_seller

                and cart.created_at >=
                    p_from

                and cart.created_at <
                    p_to

            union

            select
                distinct
                cart.id,
                cart.status,
                cart.created_at

            from
                public.marketplace_order_groups order_group

            join
                public.marketplace_carts cart
              on cart.id =
                 order_group.cart_id

            join
                public.marketplace_orders orders
              on orders.group_id =
                 order_group.id

            where
                orders.seller_organization_id =
                    v_seller

                and cart.created_at >=
                    p_from

                and cart.created_at <
                    p_to
        ),

        trend as (
            select
                date_trunc(
                    'day',
                    orders.created_at
                )::date as day,

                orders.currency::text as currency,

                count(*)::integer as orders,

                coalesce(
                    sum(
                        orders.total
                    ),
                    0
                )::numeric as revenue

            from
                paid_orders orders

            group by
                date_trunc(
                    'day',
                    orders.created_at
                )::date,

                orders.currency
        )

        select
            jsonb_build_object(

                'organizationId',
                    v_seller,

                'from',
                    p_from,

                'to',
                    p_to,

                'orders',
                    (
                        select
                            count(*)::integer
                        from
                            seller_orders
                    ),

                'paidOrders',
                    (
                        select
                            count(*)::integer
                        from
                            paid_orders
                    ),

                'customers',
                    (
                        select
                            count(
                                distinct customer_id
                            )::integer
                        from
                            seller_orders
                    ),

                'repeatCustomers',
                    (
                        select
                            count(*)::integer

                        from (
                            select
                                customer_id

                            from
                                paid_orders

                            group by
                                customer_id

                            having
                                count(*) > 1
                        ) repeat_customer
                    ),

                'carts',
                    (
                        select
                            count(*)::integer
                        from
                            seller_carts
                    ),

                'convertedCarts',
                    (
                        select
                            count(*)::integer
                        from
                            seller_carts
                        where
                            status =
                                'converted'
                    ),

                'abandonedCarts',
                    (
                        select
                            count(*)::integer
                        from
                            seller_carts
                        where
                            status =
                                'abandoned'
                    ),

                'conversionRate',
                    (
                        select
                            case
                                when count(*) = 0 then
                                    0
                                else
                                    round(
                                        (
                                            count(*) filter (
                                                where
                                                    status =
                                                        'converted'
                                            )::numeric
                                            /
                                            count(*)::numeric
                                        ) * 100,
                                        2
                                    )
                            end
                        from
                            seller_carts
                    ),

                'currencies',
                    coalesce(
                        (
                            select
                                jsonb_agg(
                                    jsonb_build_object(
                                        'currency',
                                            currency,

                                        'orders',
                                            orders,

                                        'subtotal',
                                            subtotal,

                                        'total',
                                            total,

                                        'averageOrder',
                                            average_order
                                    )

                                    order by
                                        currency
                                )

                            from
                                currency_totals
                        ),
                        '[]'::jsonb
                    ),

                'products',
                    coalesce(
                        (
                            select
                                jsonb_agg(
                                    jsonb_build_object(
                                        'productId',
                                            product.product_id,

                                        'title',
                                            product.product_title,

                                        'orders',
                                            product.orders,

                                        'units',
                                            product.units,

                                        'amounts',
                                            coalesce(
                                                amounts.amounts,
                                                '[]'::jsonb
                                            )
                                    )

                                    order by
                                        product.units desc
                                )

                            from
                                product_totals product

                            left join
                                product_amounts amounts
                              on amounts.product_id =
                                 product.product_id
                        ),
                        '[]'::jsonb
                    ),

                'customersRanking',
                    coalesce(
                        (
                            select
                                jsonb_agg(
                                    jsonb_build_object(
                                        'customerId',
                                            customer.customer_id,

                                        'name',
                                            customer.customer_name,

                                        'orders',
                                            customer.orders,

                                        'amounts',
                                            coalesce(
                                                amounts.amounts,
                                                '[]'::jsonb
                                            )
                                    )

                                    order by
                                        customer.orders desc
                                )

                            from
                                customer_totals customer

                            left join
                                customer_amounts amounts
                              on amounts.customer_id =
                                 customer.customer_id
                        ),
                        '[]'::jsonb
                    ),

                'trend',
                    coalesce(
                        (
                            select
                                jsonb_agg(
                                    jsonb_build_object(
                                        'day',
                                            trend.day,

                                        'currency',
                                            trend.currency,

                                        'orders',
                                            trend.orders,

                                        'revenue',
                                            trend.revenue
                                    )

                                    order by
                                        trend.day,
                                        trend.currency
                                )

                            from
                                trend
                        ),
                        '[]'::jsonb
                    )
            )
    );

end;

$function$;


-- ============================================================
-- PERSONNEL SNAPSHOT
-- ============================================================

create or replace function
public.marketplace_seller_personnel_snapshot()
returns jsonb

language plpgsql
stable
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
    v_name text;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then

        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';

    end if;


    select
        organization.name

    into
        v_name

    from
        public.organizations organization

    where
        organization.id =
            v_seller;


    return
        jsonb_build_object(

            'organizationId',
                v_seller,

            'organizationName',
                v_name,


            'members',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'profileId',
                                        profile.id,

                                    'name',
                                        profile.full_name,

                                    'email',
                                        profile.email,

                                    'phone',
                                        profile.phone,

                                    'photoUrl',
                                        profile.photo_url,

                                    'membershipRole',
                                        membership.role,

                                    'accessStatus',
                                        coalesce(
                                            membership.status,
                                            'active'
                                        ),

                                    'joinedAt',
                                        membership.joined_at,

                                    'department',
                                        personnel.department,

                                    'contractType',
                                        personnel.contract_type,

                                    'location',
                                        personnel.location,

                                    'availability',
                                        personnel.availability,

                                    'employmentStatus',
                                        coalesce(
                                            personnel.employment_status,
                                            'active'
                                        ),

                                    'monthlyCompensation',
                                        personnel.monthly_compensation,

                                    'currency',
                                        coalesce(
                                            personnel.currency_code::text,
                                            'MGA'
                                        )
                                )

                                order by
                                    profile.full_name
                            )

                        from
                            public.organization_members membership

                        join
                            public.profiles profile
                          on profile.id =
                             membership.profile_id

                        left join
                            public.seller_personnel_profiles personnel
                          on personnel.organization_id =
                             membership.organization_id
                         and personnel.profile_id =
                             membership.profile_id

                        where
                            membership.organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'invitations',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        invitation.id,

                                    'profileId',
                                        invitation.invited_profile_id,

                                    'target',
                                        coalesce(
                                            invited.full_name,
                                            invitation.invited_email,
                                            'Invitation'
                                        ),

                                    'email',
                                        coalesce(
                                            invitation.invited_email,
                                            invited.email
                                        ),

                                    'memberRole',
                                        invitation.member_role,

                                    'status',
                                        invitation.status,

                                    'expiresAt',
                                        invitation.expires_at,

                                    'createdAt',
                                        invitation.created_at
                                )

                                order by
                                    invitation.created_at desc
                            )

                        from
                            public.organization_invitations invitation

                        left join
                            public.profiles invited
                          on invited.id =
                             invitation.invited_profile_id

                        where
                            invitation.organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'internalRoles',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        role.id,

                                    'code',
                                        role.code,

                                    'label',
                                        role.label,

                                    'permissions',
                                        to_jsonb(
                                            role.permissions
                                        ),

                                    'isActive',
                                        role.is_active,

                                    'createdAt',
                                        role.created_at
                                )

                                order by
                                    role.label
                            )

                        from
                            public.organization_internal_roles role

                        where
                            role.organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'roleAssignments',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'roleId',
                                        assignment.internal_role_id,

                                    'profileId',
                                        assignment.profile_id
                                )
                            )

                        from
                            public.organization_internal_role_assignments assignment

                        where
                            assignment.organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'assignments',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        assignment.id,

                                    'profileId',
                                        assignment.profile_id,

                                    'mission',
                                        assignment.mission,

                                    'scope',
                                        assignment.scope,

                                    'startsAt',
                                        assignment.starts_at,

                                    'endsAt',
                                        assignment.ends_at,

                                    'status',
                                        assignment.status,

                                    'createdAt',
                                        assignment.created_at
                                )

                                order by
                                    assignment.created_at desc
                            )

                        from
                            public.seller_personnel_assignments assignment

                        where
                            assignment.organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'attendance',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        attendance.id,

                                    'profileId',
                                        attendance.profile_id,

                                    'workDate',
                                        attendance.work_date,

                                    'checkInAt',
                                        attendance.check_in_at,

                                    'checkOutAt',
                                        attendance.check_out_at,

                                    'note',
                                        attendance.note
                                )

                                order by
                                    attendance.work_date desc,
                                    attendance.check_in_at desc nulls last
                            )

                        from
                            public.seller_personnel_attendance attendance

                        where
                            attendance.organization_id =
                                v_seller

                            and attendance.work_date >=
                                current_date -
                                45
                    ),
                    '[]'::jsonb
                ),


            'leaves',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        leave_record.id,

                                    'profileId',
                                        leave_record.profile_id,

                                    'type',
                                        leave_record.leave_type,

                                    'startsOn',
                                        leave_record.starts_on,

                                    'endsOn',
                                        leave_record.ends_on,

                                    'status',
                                        leave_record.status,

                                    'decisionAt',
                                        leave_record.decision_at,

                                    'createdAt',
                                        leave_record.created_at
                                )

                                order by
                                    leave_record.created_at desc
                            )

                        from
                            public.seller_personnel_leaves leave_record

                        where
                            leave_record.organization_id =
                                v_seller
                    ),
                    '[]'::jsonb
                ),


            'documents',
                coalesce(
                    (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                        document.id,

                                    'profileId',
                                        document.profile_id,

                                    'name',
                                        document.name,

                                    'category',
                                        document.category,

                                    'storagePath',
                                        document.storage_path,

                                    'fileName',
                                        document.file_name,

                                    'mimeType',
                                        document.mime_type,

                                    'expiresAt',
                                        document.expires_at,

                                    'status',
                                        document.status,

                                    'createdAt',
                                        document.created_at
                                )

                                order by
                                    document.created_at desc
                            )

                        from
                            public.seller_personnel_documents document

                        where
                            document.organization_id =
                                v_seller

                            and document.status =
                                'active'
                    ),
                    '[]'::jsonb
                )
        );

end;

$function$;


-- ============================================================
-- PERSONNEL HELPERS
-- ============================================================

create or replace function
public.marketplace_seller_personnel_assert_member(
    p_organization_id uuid,
    p_profile_id uuid
)
returns void

language plpgsql
stable
security definer
set search_path = ''

as $function$

begin

    if not exists (
        select
            1

        from
            public.organization_members membership

        where
            membership.organization_id =
                p_organization_id

            and membership.profile_id =
                p_profile_id
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Profile is not a member of this seller organization';
    end if;

end;

$function$;


revoke all
on function
public.marketplace_seller_personnel_assert_member(uuid,uuid)
from public, anon, authenticated;


-- ============================================================
-- PERSONNEL PROFILE
-- ============================================================

create or replace function
public.marketplace_save_personnel_profile(
    p_profile_id uuid,
    p_department text,
    p_contract_type text,
    p_location text,
    p_availability text,
    p_monthly_compensation numeric,
    p_currency text,
    p_employment_status text
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


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    perform
        public.marketplace_seller_personnel_assert_member(
            v_seller,
            p_profile_id
        );


    if p_employment_status not in (
        'active',
        'on_leave',
        'inactive'
    ) then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid employment status';
    end if;


    if
        p_monthly_compensation is not null
        and p_monthly_compensation < 0
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Compensation cannot be negative';
    end if;


    if upper(
        coalesce(
            p_currency,
            'MGA'
        )
    ) !~ '^[A-Z]{3}$' then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid currency code';
    end if;


    insert into
        public.seller_personnel_profiles (
            organization_id,
            profile_id,
            department,
            contract_type,
            location,
            availability,
            employment_status,
            monthly_compensation,
            currency_code,
            updated_by
        )

    values (
        v_seller,
        p_profile_id,
        nullif(
            btrim(
                coalesce(
                    p_department,
                    ''
                )
            ),
            ''
        ),
        nullif(
            btrim(
                coalesce(
                    p_contract_type,
                    ''
                )
            ),
            ''
        ),
        nullif(
            btrim(
                coalesce(
                    p_location,
                    ''
                )
            ),
            ''
        ),
        nullif(
            btrim(
                coalesce(
                    p_availability,
                    ''
                )
            ),
            ''
        ),
        p_employment_status,
        p_monthly_compensation,
        upper(
            coalesce(
                p_currency,
                'MGA'
            )
        )::char(3),
        auth.uid()
    )

    on conflict (
        organization_id,
        profile_id
    )
    do update

    set
        department =
            excluded.department,

        contract_type =
            excluded.contract_type,

        location =
            excluded.location,

        availability =
            excluded.availability,

        employment_status =
            excluded.employment_status,

        monthly_compensation =
            excluded.monthly_compensation,

        currency_code =
            excluded.currency_code,

        updated_by =
            auth.uid(),

        updated_at =
            now();

end;

$function$;


create or replace function
public.marketplace_set_personnel_access(
    p_profile_id uuid,
    p_active boolean
)
returns void

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
    v_owner uuid;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    select
        owner_id

    into
        v_owner

    from
        public.organizations

    where
        id =
            v_seller;


    if p_profile_id =
       v_owner then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Organization owner access cannot be suspended';
    end if;


    update
        public.organization_members

    set
        status =
            case
                when p_active
                then 'active'
                else 'suspended'
            end,

        left_at =
            case
                when p_active
                then null
                else now()
            end

    where
        organization_id =
            v_seller

        and profile_id =
            p_profile_id;


    if not found then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Organization member not found';
    end if;

end;

$function$;


-- ============================================================
-- PERSONNEL INVITATIONS
-- ============================================================

create or replace function
public.marketplace_invite_seller_personnel(
    p_identifier text,
    p_member_role text default 'seller',
    p_expires_days integer default 7
)
returns uuid

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
    v_identifier text;
    v_profile uuid;
    v_email text;
    v_id uuid;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    v_identifier :=
        lower(
            btrim(
                coalesce(
                    p_identifier,
                    ''
                )
            )
        );


    if v_identifier = '' then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Identifier or email is required';
    end if;


    if
        p_expires_days < 1
        or p_expires_days > 30
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invitation expiry must be between 1 and 30 days';
    end if;


    select
        profile.id,
        profile.email

    into
        v_profile,
        v_email

    from
        public.profiles profile

    where
        lower(
            profile.username
        ) =
            v_identifier

        or lower(
            profile.email
        ) =
            v_identifier

    order by
        case
            when lower(
                profile.username
            ) =
                v_identifier
            then 0
            else 1
        end

    limit 1;


    if
        v_profile is not null
        and exists (
            select
                1

            from
                public.organization_members membership

            where
                membership.organization_id =
                    v_seller

                and membership.profile_id =
                    v_profile

                and coalesce(
                    membership.status,
                    'active'
                ) =
                    'active'
        )
    then
        raise exception
            using
                errcode =
                    '23505',

                message =
                    'This profile is already an active member';
    end if;


    if v_profile is null then

        if position(
            '@'
            in v_identifier
        ) = 0 then
            raise exception
                using
                    errcode =
                        'P0002',

                    message =
                        'Profile identifier not found';
        end if;


        v_email :=
            v_identifier;

    end if;


    if exists (
        select
            1

        from
            public.organization_invitations invitation

        where
            invitation.organization_id =
                v_seller

            and invitation.status =
                'pending'

            and (
                (
                    v_profile is not null
                    and invitation.invited_profile_id =
                        v_profile
                )

                or (
                    v_profile is null
                    and lower(
                        coalesce(
                            invitation.invited_email,
                            ''
                        )
                    ) =
                        v_email
                )
            )
    ) then
        raise exception
            using
                errcode =
                    '23505',

                message =
                    'A pending invitation already exists';
    end if;


    insert into
        public.organization_invitations (
            organization_id,
            invited_profile_id,
            invited_email,
            invited_by,
            member_role,
            token_hash,
            expires_at
        )

    values (
        v_seller,

        v_profile,

        case
            when v_profile is null
            then v_email
            else null
        end,

        auth.uid(),

        coalesce(
            nullif(
                btrim(
                    p_member_role
                ),
                ''
            ),
            'seller'
        ),

        md5(
            gen_random_uuid()::text
            ||
            clock_timestamp()::text
            ||
            auth.uid()::text
        ),

        now()
        +
        make_interval(
            days =>
                p_expires_days
        )
    )

    returning
        id
    into
        v_id;


    return
        v_id;

end;

$function$;


create or replace function
public.marketplace_revoke_seller_personnel_invitation(
    p_invitation_id uuid
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


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    update
        public.organization_invitations

    set
        status =
            'revoked',

        responded_at =
            now()

    where
        id =
            p_invitation_id

        and organization_id =
            v_seller

        and status =
            'pending';


    if not found then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Pending invitation not found';
    end if;

end;

$function$;


create or replace function
public.marketplace_respond_seller_personnel_invitation(
    p_invitation_id uuid,
    p_accept boolean
)
returns void

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_invitation
        public.organization_invitations%rowtype;

    v_email text;

begin

    if auth.uid() is null then
        raise exception
            using
                errcode =
                    '28000',

                message =
                    'Authentication required';
    end if;


    select
        *

    into
        v_invitation

    from
        public.organization_invitations

    where
        id =
            p_invitation_id

    for update;


    if not found then
        raise exception
            using
                errcode =
                    'P0002',

                message =
                    'Invitation not found';
    end if;


    if v_invitation.status <>
       'pending' then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invitation is no longer pending';
    end if;


    if v_invitation.expires_at <=
       now() then

        update
            public.organization_invitations

        set
            status =
                'expired',

            responded_at =
                now()

        where
            id =
                p_invitation_id;


        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invitation has expired';
    end if;


    select
        lower(
            profile.email
        )

    into
        v_email

    from
        public.profiles profile

    where
        profile.id =
            auth.uid();


    if
        v_invitation.invited_profile_id is not null
        and v_invitation.invited_profile_id <>
            auth.uid()
    then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Invitation does not belong to this profile';
    end if;


    if
        v_invitation.invited_profile_id is null
        and lower(
            coalesce(
                v_invitation.invited_email,
                ''
            )
        ) <>
            coalesce(
                v_email,
                ''
            )
    then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Invitation email does not match this profile';
    end if;


    update
        public.organization_invitations

    set
        status =
            case
                when p_accept
                then 'accepted'
                else 'declined'
            end,

        invited_profile_id =
            coalesce(
                invited_profile_id,
                auth.uid()
            ),

        invited_email =
            case
                when invited_profile_id is null
                then null
                else invited_email
            end,

        responded_at =
            now()

    where
        id =
            p_invitation_id;


    if p_accept then

        insert into
            public.organization_members (
                organization_id,
                profile_id,
                role,
                status,
                joined_at,
                left_at
            )

        values (
            v_invitation.organization_id,
            auth.uid(),
            v_invitation.member_role,
            'active',
            now(),
            null
        )

        on conflict do nothing;


        update
            public.organization_members

        set
            role =
                v_invitation.member_role,

            status =
                'active',

            joined_at =
                coalesce(
                    joined_at,
                    now()
                ),

            left_at =
                null

        where
            organization_id =
                v_invitation.organization_id

            and profile_id =
                auth.uid();

    end if;

end;

$function$;


-- ============================================================
-- INTERNAL ROLES
-- ============================================================

create or replace function
public.marketplace_save_personnel_internal_role(
    p_id uuid,
    p_label text,
    p_permissions text[],
    p_is_active boolean default true
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


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    if nullif(
        btrim(
            coalesce(
                p_label,
                ''
            )
        ),
        ''
    ) is null then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Role label is required';
    end if;


    if p_id is null then

        v_code :=
            'role_' ||
            substr(
                md5(
                    btrim(p_label)
                    ||
                    gen_random_uuid()::text
                ),
                1,
                12
            );


        insert into
            public.organization_internal_roles (
                organization_id,
                code,
                label,
                permissions,
                is_active,
                created_by
            )

        values (
            v_seller,
            v_code,
            btrim(p_label),
            coalesce(
                p_permissions,
                '{}'::text[]
            ),
            p_is_active,
            auth.uid()
        )

        returning
            id
        into
            v_id;

    else

        update
            public.organization_internal_roles

        set
            label =
                btrim(p_label),

            permissions =
                coalesce(
                    p_permissions,
                    '{}'::text[]
                ),

            is_active =
                p_is_active,

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
                        '42501',

                    message =
                        'Internal role not found';
        end if;

    end if;


    return
        v_id;

end;

$function$;


create or replace function
public.marketplace_set_personnel_internal_role_members(
    p_role_id uuid,
    p_profile_ids uuid[]
)
returns integer

language plpgsql
security definer
set search_path = ''

as $function$

declare
    v_seller uuid;
    v_profile uuid;
    v_count integer := 0;

begin

    v_seller :=
        public.marketplace_current_seller_organization();


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    if not exists (
        select
            1

        from
            public.organization_internal_roles role

        where
            role.id =
                p_role_id

            and role.organization_id =
                v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Internal role not found';
    end if;


    delete from
        public.organization_internal_role_assignments

    where
        organization_id =
            v_seller

        and internal_role_id =
            p_role_id;


    foreach
        v_profile
    in array
        coalesce(
            p_profile_ids,
            '{}'::uuid[]
        )

    loop

        if exists (
            select
                1

            from
                public.organization_members membership

            where
                membership.organization_id =
                    v_seller

                and membership.profile_id =
                    v_profile
        ) then

            insert into
                public.organization_internal_role_assignments (
                    organization_id,
                    internal_role_id,
                    profile_id,
                    assigned_by
                )

            values (
                v_seller,
                p_role_id,
                v_profile,
                auth.uid()
            )

            on conflict do nothing;


            v_count :=
                v_count +
                1;

        end if;

    end loop;


    return
        v_count;

end;

$function$;


-- ============================================================
-- ASSIGNMENTS
-- ============================================================

create or replace function
public.marketplace_save_personnel_assignment(
    p_id uuid,
    p_profile_id uuid,
    p_mission text,
    p_scope text,
    p_starts_at timestamptz,
    p_ends_at timestamptz,
    p_status text default 'planned'
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


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    perform
        public.marketplace_seller_personnel_assert_member(
            v_seller,
            p_profile_id
        );


    if p_status not in (
        'planned',
        'in_progress',
        'completed',
        'cancelled'
    ) then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid assignment status';
    end if;


    if nullif(
        btrim(
            coalesce(
                p_mission,
                ''
            )
        ),
        ''
    ) is null then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Mission is required';
    end if;


    if
        p_starts_at is not null
        and p_ends_at is not null
        and p_ends_at <=
            p_starts_at
    then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Assignment end must be after start';
    end if;


    if p_id is null then

        insert into
            public.seller_personnel_assignments (
                organization_id,
                profile_id,
                mission,
                scope,
                starts_at,
                ends_at,
                status,
                created_by
            )

        values (
            v_seller,
            p_profile_id,
            btrim(p_mission),
            nullif(
                btrim(
                    coalesce(
                        p_scope,
                        ''
                    )
                ),
                ''
            ),
            p_starts_at,
            p_ends_at,
            p_status,
            auth.uid()
        )

        returning
            id
        into
            v_id;

    else

        update
            public.seller_personnel_assignments

        set
            profile_id =
                p_profile_id,

            mission =
                btrim(p_mission),

            scope =
                nullif(
                    btrim(
                        coalesce(
                            p_scope,
                            ''
                        )
                    ),
                    ''
                ),

            starts_at =
                p_starts_at,

            ends_at =
                p_ends_at,

            status =
                p_status,

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
                        '42501',

                    message =
                        'Assignment not found';
        end if;

    end if;


    return
        v_id;

end;

$function$;


-- ============================================================
-- ATTENDANCE
-- ============================================================

create or replace function
public.marketplace_mark_personnel_attendance(
    p_profile_id uuid,
    p_work_date date,
    p_action text,
    p_note text default null
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


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    perform
        public.marketplace_seller_personnel_assert_member(
            v_seller,
            p_profile_id
        );


    if p_action not in (
        'check_in',
        'check_out'
    ) then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid attendance action';
    end if;


    if p_action =
       'check_in' then

        insert into
            public.seller_personnel_attendance (
                organization_id,
                profile_id,
                work_date,
                check_in_at,
                note,
                recorded_by
            )

        values (
            v_seller,
            p_profile_id,
            p_work_date,
            now(),
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

        on conflict (
            organization_id,
            profile_id,
            work_date
        )
        do update

        set
            check_in_at =
                coalesce(
                    public.seller_personnel_attendance.check_in_at,
                    now()
                ),

            note =
                coalesce(
                    excluded.note,
                    public.seller_personnel_attendance.note
                ),

            recorded_by =
                auth.uid(),

            updated_at =
                now();

    else

        update
            public.seller_personnel_attendance

        set
            check_out_at =
                now(),

            note =
                coalesce(
                    nullif(
                        btrim(
                            coalesce(
                                p_note,
                                ''
                            )
                        ),
                        ''
                    ),
                    note
                ),

            recorded_by =
                auth.uid(),

            updated_at =
                now()

        where
            organization_id =
                v_seller

            and profile_id =
                p_profile_id

            and work_date =
                p_work_date

            and check_in_at is not null;


        if not found then
            raise exception
                using
                    errcode =
                        '22023',

                    message =
                        'Check-in is required before check-out';
        end if;

    end if;

end;

$function$;


-- ============================================================
-- LEAVES
-- ============================================================

create or replace function
public.marketplace_save_personnel_leave(
    p_id uuid,
    p_profile_id uuid,
    p_leave_type text,
    p_starts_on date,
    p_ends_on date
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


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    perform
        public.marketplace_seller_personnel_assert_member(
            v_seller,
            p_profile_id
        );


    if p_ends_on <
       p_starts_on then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Leave end must be on or after start';
    end if;


    if p_id is null then

        insert into
            public.seller_personnel_leaves (
                organization_id,
                profile_id,
                leave_type,
                starts_on,
                ends_on,
                created_by
            )

        values (
            v_seller,
            p_profile_id,
            btrim(p_leave_type),
            p_starts_on,
            p_ends_on,
            auth.uid()
        )

        returning
            id
        into
            v_id;

    else

        update
            public.seller_personnel_leaves

        set
            profile_id =
                p_profile_id,

            leave_type =
                btrim(p_leave_type),

            starts_on =
                p_starts_on,

            ends_on =
                p_ends_on,

            updated_at =
                now()

        where
            id =
                p_id

            and organization_id =
                v_seller

            and status =
                'pending'

        returning
            id
        into
            v_id;


        if v_id is null then
            raise exception
                using
                    errcode =
                        '42501',

                    message =
                        'Pending leave not found';
        end if;

    end if;


    return
        v_id;

end;

$function$;


create or replace function
public.marketplace_decide_personnel_leave(
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


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    if p_status not in (
        'approved',
        'declined',
        'cancelled'
    ) then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Invalid leave decision';
    end if;


    update
        public.seller_personnel_leaves

    set
        status =
            p_status,

        decision_by =
            auth.uid(),

        decision_at =
            now(),

        updated_at =
            now()

    where
        id =
            p_id

        and organization_id =
            v_seller

        and status =
            'pending';


    if not found then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Pending leave not found';
    end if;

end;

$function$;


-- ============================================================
-- DOCUMENTS
-- ============================================================

create or replace function
public.marketplace_save_personnel_document(
    p_profile_id uuid,
    p_name text,
    p_category text,
    p_storage_path text,
    p_file_name text,
    p_mime_type text,
    p_expires_at date
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


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    perform
        public.marketplace_seller_personnel_assert_member(
            v_seller,
            p_profile_id
        );


    if nullif(
        btrim(
            coalesce(
                p_name,
                ''
            )
        ),
        ''
    ) is null then
        raise exception
            using
                errcode =
                    '22023',

                message =
                    'Document name is required';
    end if;


    if split_part(
        p_storage_path,
        '/',
        1
    ) <>
       v_seller::text then

        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Invalid personnel document storage path';
    end if;


    insert into
        public.seller_personnel_documents (
            organization_id,
            profile_id,
            name,
            category,
            storage_path,
            file_name,
            mime_type,
            expires_at,
            created_by
        )

    values (
        v_seller,
        p_profile_id,
        btrim(p_name),
        btrim(p_category),
        p_storage_path,
        p_file_name,
        p_mime_type,
        p_expires_at,
        auth.uid()
    )

    returning
        id
    into
        v_id;


    return
        v_id;

end;

$function$;


create or replace function
public.marketplace_archive_personnel_document(
    p_id uuid
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


    if not public.marketplace_can_manage_seller_personnel(
        v_seller
    ) then
        raise exception
            using
                errcode =
                    '42501',

                message =
                    'Personnel management access denied';
    end if;


    update
        public.seller_personnel_documents

    set
        status =
            'archived',

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
                    '42501',

                message =
                    'Personnel document not found';
    end if;

end;

$function$;


-- ============================================================
-- PRIVATE STORAGE
-- ============================================================

insert into
    storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )

values (
    'seller-personnel-documents',
    'seller-personnel-documents',
    false,
    15728640,
    array[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
)

on conflict (
    id
)
do update

set
    public =
        false,

    file_size_limit =
        excluded.file_size_limit,

    allowed_mime_types =
        excluded.allowed_mime_types;


create or replace function
public.marketplace_seller_personnel_storage_access(
    p_name text
)
returns boolean

language plpgsql
stable
security definer
set search_path = ''

as $function$

declare
    v_organization uuid;

begin

    begin

        v_organization :=
            split_part(
                p_name,
                '/',
                1
            )::uuid;

    exception
        when others then
            return false;
    end;


    return
        public.marketplace_can_manage_seller_personnel(
            v_organization
        );

end;

$function$;


revoke all
on function
public.marketplace_seller_personnel_storage_access(text)
from public, anon;


grant execute
on function
public.marketplace_seller_personnel_storage_access(text)
to authenticated;


drop policy if exists
seller_personnel_documents_storage_read
on storage.objects;

create policy
seller_personnel_documents_storage_read
on storage.objects
for select
to authenticated
using (
    bucket_id =
        'seller-personnel-documents'

    and public.marketplace_seller_personnel_storage_access(
        name
    )
);


drop policy if exists
seller_personnel_documents_storage_insert
on storage.objects;

create policy
seller_personnel_documents_storage_insert
on storage.objects
for insert
to authenticated
with check (
    bucket_id =
        'seller-personnel-documents'

    and public.marketplace_seller_personnel_storage_access(
        name
    )
);


drop policy if exists
seller_personnel_documents_storage_delete
on storage.objects;

create policy
seller_personnel_documents_storage_delete
on storage.objects
for delete
to authenticated
using (
    bucket_id =
        'seller-personnel-documents'

    and public.marketplace_seller_personnel_storage_access(
        name
    )
);


-- ============================================================
-- RPC SECURITY
-- ============================================================

revoke all
on function
public.marketplace_seller_customers_snapshot()
from public, anon;

grant execute
on function
public.marketplace_seller_customers_snapshot()
to authenticated;


revoke all
on function
public.marketplace_save_customer_segment(uuid,text,text)
from public, anon;

grant execute
on function
public.marketplace_save_customer_segment(uuid,text,text)
to authenticated;


revoke all
on function
public.marketplace_set_customer_segment_status(uuid,text)
from public, anon;

grant execute
on function
public.marketplace_set_customer_segment_status(uuid,text)
to authenticated;


revoke all
on function
public.marketplace_set_customer_segment_members(uuid,uuid[])
from public, anon;

grant execute
on function
public.marketplace_set_customer_segment_members(uuid,uuid[])
to authenticated;


revoke all
on function
public.marketplace_adjust_customer_loyalty(uuid,integer,text,uuid)
from public, anon;

grant execute
on function
public.marketplace_adjust_customer_loyalty(uuid,integer,text,uuid)
to authenticated;


revoke all
on function
public.marketplace_save_customer_dispute(uuid,uuid,uuid,text,text,text,text)
from public, anon;

grant execute
on function
public.marketplace_save_customer_dispute(uuid,uuid,uuid,text,text,text,text)
to authenticated;


revoke all
on function
public.marketplace_seller_performance_snapshot(timestamptz,timestamptz)
from public, anon;

grant execute
on function
public.marketplace_seller_performance_snapshot(timestamptz,timestamptz)
to authenticated;


revoke all
on function
public.marketplace_seller_personnel_snapshot()
from public, anon;

grant execute
on function
public.marketplace_seller_personnel_snapshot()
to authenticated;


revoke all
on function
public.marketplace_save_personnel_profile(uuid,text,text,text,text,numeric,text,text)
from public, anon;

grant execute
on function
public.marketplace_save_personnel_profile(uuid,text,text,text,text,numeric,text,text)
to authenticated;


revoke all
on function
public.marketplace_set_personnel_access(uuid,boolean)
from public, anon;

grant execute
on function
public.marketplace_set_personnel_access(uuid,boolean)
to authenticated;


revoke all
on function
public.marketplace_invite_seller_personnel(text,text,integer)
from public, anon;

grant execute
on function
public.marketplace_invite_seller_personnel(text,text,integer)
to authenticated;


revoke all
on function
public.marketplace_revoke_seller_personnel_invitation(uuid)
from public, anon;

grant execute
on function
public.marketplace_revoke_seller_personnel_invitation(uuid)
to authenticated;


revoke all
on function
public.marketplace_respond_seller_personnel_invitation(uuid,boolean)
from public, anon;

grant execute
on function
public.marketplace_respond_seller_personnel_invitation(uuid,boolean)
to authenticated;


revoke all
on function
public.marketplace_save_personnel_internal_role(uuid,text,text[],boolean)
from public, anon;

grant execute
on function
public.marketplace_save_personnel_internal_role(uuid,text,text[],boolean)
to authenticated;


revoke all
on function
public.marketplace_set_personnel_internal_role_members(uuid,uuid[])
from public, anon;

grant execute
on function
public.marketplace_set_personnel_internal_role_members(uuid,uuid[])
to authenticated;


revoke all
on function
public.marketplace_save_personnel_assignment(uuid,uuid,text,text,timestamptz,timestamptz,text)
from public, anon;

grant execute
on function
public.marketplace_save_personnel_assignment(uuid,uuid,text,text,timestamptz,timestamptz,text)
to authenticated;


revoke all
on function
public.marketplace_mark_personnel_attendance(uuid,date,text,text)
from public, anon;

grant execute
on function
public.marketplace_mark_personnel_attendance(uuid,date,text,text)
to authenticated;


revoke all
on function
public.marketplace_save_personnel_leave(uuid,uuid,text,date,date)
from public, anon;

grant execute
on function
public.marketplace_save_personnel_leave(uuid,uuid,text,date,date)
to authenticated;


revoke all
on function
public.marketplace_decide_personnel_leave(uuid,text)
from public, anon;

grant execute
on function
public.marketplace_decide_personnel_leave(uuid,text)
to authenticated;


revoke all
on function
public.marketplace_save_personnel_document(uuid,text,text,text,text,text,date)
from public, anon;

grant execute
on function
public.marketplace_save_personnel_document(uuid,text,text,text,text,text,date)
to authenticated;


revoke all
on function
public.marketplace_archive_personnel_document(uuid)
from public, anon;

grant execute
on function
public.marketplace_archive_personnel_document(uuid)
to authenticated;


comment on table
public.marketplace_customer_segments
is
'Seller CRM segmentation extension. Marketplace orders remain the customer commercial authority.';


comment on table
public.marketplace_customer_loyalty_ledger
is
'Append-only manual loyalty points ledger. No automatic checkout accrual is performed.';


comment on table
public.marketplace_customer_disputes
is
'Seller CRM dispute tracking only. It does not mutate order, refund, stock or payment authorities.';


comment on table
public.seller_personnel_profiles
is
'Seller HR metadata extension. organization_members remains the membership/access authority.';


comment on column
public.seller_personnel_profiles.monthly_compensation
is
'Contractual/planned compensation only. This column is not proof of payment and does not replace the financial ledger.';


commit;