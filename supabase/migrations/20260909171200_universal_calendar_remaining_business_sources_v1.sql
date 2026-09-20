-- ============================================================
-- INDESY MIALY
-- U-CAL-1B3A
--
-- Remaining safe business projections.
--
-- No business row is copied into erp_calendar_items.
-- No fight datetime is invented.
-- ============================================================

create or replace function public.get_user_remaining_business_calendar_feed(
    p_from timestamptz default null,
    p_to timestamptz default null
)
returns table (
    calendar_key text,
    source_id uuid,

    source_table text,
    source_kind text,
    relation_kind text,

    title text,
    description text,

    starts_at timestamptz,
    ends_at timestamptz,
    all_day boolean,

    event_type text,
    status text,

    location text,
    context_role text,

    editable boolean,

    metadata jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_profile_id uuid := auth.uid();
begin
    if v_profile_id is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    return query

    with

    my_org_ids as (

        select distinct om.organization_id
        from public.organization_members om

        where om.profile_id = v_profile_id
          and om.organization_id is not null
          and om.left_at is null
          and lower(
              coalesce(
                  to_jsonb(om)->>'status',
                  'active'
              )
          ) = 'active'


        union


        select distinct cm.organization_id
        from public.club_members cm

        where cm.profile_id = v_profile_id
          and cm.organization_id is not null
          and cm.left_at is null
          and lower(
              coalesce(
                  to_jsonb(cm)->>'status',
                  'active'
              )
          ) = 'active'


        union


        select distinct ao.organization_id
        from public.active_organizations ao

        where ao.profile_id = v_profile_id
          and ao.organization_id is not null
    ),

    remaining_event_relations as (

        -- ====================================================
        -- FAN TICKET RESERVATION -> EVENT
        -- ticket_reservations.ticket_type_id
        -- -> ticket_types.event_id
        -- ====================================================

        select
            tt.event_id,
            'ticket_reservation'::text
                as relation_kind

        from public.ticket_reservations tr

        join public.ticket_types tt
          on tt.id = tr.ticket_type_id

        where tr.customer_profile_id = v_profile_id
          and tt.event_id is not null
          and lower(
              coalesce(
                  to_jsonb(tr)->>'status',
                  'active'
              )
          ) not in (
              'cancelled',
              'canceled',
              'expired',
              'refunded'
          )


        union all


        -- ====================================================
        -- EVENT REGISTRATION -> EVENT
        -- ====================================================

        select
            er.event_id,
            'registration'::text

        from public.event_registrations er

        where er.event_id is not null
          and (
              er.applicant_profile_id = v_profile_id

              or er.applicant_organization_id in (
                  select organization_id
                  from my_org_ids
              )
          )
          and lower(
              coalesce(
                  er.status,
                  'pending'
              )
          ) not in (
              'rejected',
              'cancelled',
              'canceled',
              'withdrawn'
          )


        union all


        -- ====================================================
        -- EVENT INVITATION -> EVENT
        -- ====================================================

        select
            ei.event_id,
            'invitation'::text

        from public.event_invitations ei

        where ei.event_id is not null
          and ei.invitee_profile_id = v_profile_id
          and lower(
              coalesce(
                  ei.status,
                  'sent'
              )
          ) not in (
              'declined',
              'rejected',
              'cancelled',
              'canceled'
          )


        union all


        -- ====================================================
        -- SPONSOR RELATION -> EVENT
        -- ====================================================

        select
            es.event_id,
            'sponsor'::text

        from public.event_sponsors es

        left join public.sponsors sponsor
          on sponsor.id = es.sponsor_id

        where es.event_id is not null
          and (
              es.created_by = v_profile_id

              or sponsor.created_by = v_profile_id

              or sponsor.organization_id in (
                  select organization_id
                  from my_org_ids
              )

              or sponsor.managing_organization_id in (
                  select organization_id
                  from my_org_ids
              )
          )
          and lower(
              coalesce(
                  to_jsonb(es)->>'status',
                  'active'
              )
          ) not in (
              'rejected',
              'cancelled',
              'canceled',
              'terminated'
          )
    ),

    linked_remaining_events as (

        select
            rer.event_id,

            string_agg(
                distinct rer.relation_kind,
                ','
                order by rer.relation_kind
            )
                as relation_kind

        from remaining_event_relations rer

        where rer.event_id is not null

        group by rer.event_id
    ),

    seller_leave_rows as (

        select
            spl.id,

            to_jsonb(spl)
                as row_json

        from public.seller_personnel_leaves spl

        where (
            coalesce(
                nullif(
                    to_jsonb(spl)->>'profile_id',
                    ''
                ),
                nullif(
                    to_jsonb(spl)->>'user_id',
                    ''
                )
            )
        )::uuid = v_profile_id
    ),

    seller_leave_normalized as (

        select
            slr.id,
            slr.row_json,

            (
                coalesce(
                    nullif(
                        slr.row_json->>'starts_on',
                        ''
                    ),
                    nullif(
                        slr.row_json->>'start_date',
                        ''
                    ),
                    nullif(
                        slr.row_json->>'starts_at',
                        ''
                    )
                )
            )::date
                as leave_start_date,

            (
                coalesce(
                    nullif(
                        slr.row_json->>'ends_on',
                        ''
                    ),
                    nullif(
                        slr.row_json->>'end_date',
                        ''
                    ),
                    nullif(
                        slr.row_json->>'ends_at',
                        ''
                    )
                )
            )::date
                as leave_end_date

        from seller_leave_rows slr
    ),

    feed as (

        -- ====================================================
        -- LINKED PARENT EVENTS
        --
        -- calendar_key deliberately matches U-CAL-1B:
        -- event:<uuid>
        --
        -- Final public feed deduplicates by calendar_key.
        -- ====================================================

        select
            'event:' || e.id::text
                as calendar_key,

            e.id
                as source_id,

            'events'::text
                as source_table,

            'event'::text
                as source_kind,

            lre.relation_kind
                as relation_kind,

            coalesce(
                nullif(
                    to_jsonb(e)->>'title',
                    ''
                ),
                nullif(
                    to_jsonb(e)->>'name',
                    ''
                ),
                'Événement Indesy'
            )
                as title,

            nullif(
                to_jsonb(e)->>'description',
                ''
            )
                as description,

            e.starts_at,

            coalesce(
                e.ends_at,
                e.starts_at + interval '2 hours'
            )
                as ends_at,

            false
                as all_day,

            'sport'::text
                as event_type,

            coalesce(
                nullif(
                    to_jsonb(e)->>'status',
                    ''
                ),
                'confirmed'
            )
                as status,

            coalesce(
                nullif(
                    to_jsonb(e)->>'location',
                    ''
                ),
                nullif(
                    to_jsonb(e)->>'venue',
                    ''
                )
            )
                as location,

            null::text
                as context_role,

            false
                as editable,

            jsonb_build_object(
                'event_id',
                e.id,

                'relations',
                lre.relation_kind,

                'authority',
                'events'
            )
                as metadata

        from linked_remaining_events lre

        join public.events e
          on e.id = lre.event_id

        where e.starts_at is not null
          and e.archived_at is null


        union all


        -- ====================================================
        -- MARKETPLACE BUNDLES
        -- ====================================================

        select
            'marketplace_bundle:' ||
                bundle.id::text,

            bundle.id,

            'marketplace_bundles'::text,
            'marketplace_bundle'::text,

            'seller_organization'::text,

            coalesce(
                nullif(
                    to_jsonb(bundle)->>'name',
                    ''
                ),
                nullif(
                    to_jsonb(bundle)->>'title',
                    ''
                ),
                'Bundle Marketplace'
            ),

            nullif(
                to_jsonb(bundle)->>'description',
                ''
            ),

            bundle.starts_at,

            coalesce(
                bundle.ends_at,
                bundle.starts_at + interval '1 day'
            ),

            false,

            'commercial'::text,

            coalesce(
                nullif(
                    to_jsonb(bundle)->>'status',
                    ''
                ),
                'confirmed'
            ),

            null::text,
            'seller'::text,

            false,

            jsonb_build_object(
                'seller_organization_id',
                bundle.seller_organization_id,

                'authority',
                'marketplace_bundles'
            )

        from public.marketplace_bundles bundle

        where bundle.seller_organization_id in (
            select organization_id
            from my_org_ids
        )
          and bundle.starts_at is not null
          and lower(
              coalesce(
                  to_jsonb(bundle)->>'status',
                  'active'
              )
          ) not in (
              'cancelled',
              'canceled',
              'archived'
          )


        union all


        -- ====================================================
        -- MARKETPLACE PARTNERSHIPS
        -- ====================================================

        select
            'marketplace_partnership:' ||
                partnership.id::text,

            partnership.id,

            'marketplace_partnerships'::text,
            'marketplace_partnership'::text,

            case
                when partnership.seller_organization_id in (
                    select organization_id
                    from my_org_ids
                )
                    then 'seller_organization'

                else 'partner_organization'
            end,

            coalesce(
                nullif(
                    to_jsonb(partnership)->>'name',
                    ''
                ),
                nullif(
                    to_jsonb(partnership)->>'title',
                    ''
                ),
                'Partenariat Marketplace'
            ),

            nullif(
                to_jsonb(partnership)->>'description',
                ''
            ),

            partnership.starts_at,

            coalesce(
                partnership.ends_at,
                partnership.starts_at + interval '1 day'
            ),

            false,

            'commercial'::text,

            coalesce(
                nullif(
                    to_jsonb(partnership)->>'status',
                    ''
                ),
                'confirmed'
            ),

            null::text,
            'seller'::text,

            false,

            jsonb_build_object(
                'seller_organization_id',
                partnership.seller_organization_id,

                'partner_organization_id',
                partnership.partner_organization_id,

                'authority',
                'marketplace_partnerships'
            )

        from public.marketplace_partnerships partnership

        where (
            partnership.seller_organization_id in (
                select organization_id
                from my_org_ids
            )

            or partnership.partner_organization_id in (
                select organization_id
                from my_org_ids
            )
        )
          and partnership.starts_at is not null
          and lower(
              coalesce(
                  to_jsonb(partnership)->>'status',
                  'active'
              )
          ) not in (
              'cancelled',
              'canceled',
              'archived',
              'terminated'
          )


        union all


        -- ====================================================
        -- SPONSOR PIPELINE NEXT ACTION
        --
        -- Organizer-owned commercial pipeline.
        -- Only the explicit owner receives this Agenda item.
        -- ====================================================

        select
            'sponsor_pipeline:' ||
                pipeline.id::text,

            pipeline.id,

            'sponsor_pipeline'::text,
            'sponsor_pipeline'::text,

            'owner_profile'::text,

            coalesce(
                nullif(
                    to_jsonb(pipeline)->>'title',
                    ''
                ),
                nullif(
                    to_jsonb(pipeline)->>'name',
                    ''
                ),
                'Suivi sponsor'
            ),

            coalesce(
                nullif(
                    to_jsonb(pipeline)->>'notes',
                    ''
                ),
                nullif(
                    to_jsonb(pipeline)->>'description',
                    ''
                )
            ),

            pipeline.next_action_at,

            pipeline.next_action_at
                + interval '30 minutes',

            false,

            'deadline'::text,

            case
                when lower(
                    coalesce(
                        to_jsonb(pipeline)->>'stage',
                        ''
                    )
                ) = 'won'
                    then 'completed'

                else 'confirmed'
            end,

            null::text,
            'organizer'::text,

            false,

            jsonb_build_object(
                'event_id',
                pipeline.event_id,

                'organization_id',
                pipeline.organization_id,

                'sponsor_id',
                pipeline.sponsor_id,

                'authority',
                'sponsor_pipeline'
            )

        from public.sponsor_pipeline pipeline

        where pipeline.owner_profile_id = v_profile_id
          and pipeline.next_action_at is not null
          and lower(
              coalesce(
                  to_jsonb(pipeline)->>'stage',
                  ''
              )
          ) not in (
              'lost',
              'cancelled',
              'canceled'
          )


        union all


        -- ====================================================
        -- SELLER PERSONNEL LEAVE
        --
        -- Only the leave owner receives the universal item.
        -- No organization-wide personnel disclosure.
        --
        -- End date is interpreted as inclusive business date;
        -- FullCalendar all-day end is therefore next-day
        -- exclusive.
        -- ====================================================

        select
            'seller_personnel_leave:' ||
                leave_row.id::text,

            leave_row.id,

            'seller_personnel_leaves'::text,
            'seller_personnel_leave'::text,

            'leave_owner'::text,

            coalesce(
                nullif(
                    leave_row.row_json->>'leave_type',
                    ''
                ),
                nullif(
                    leave_row.row_json->>'type',
                    ''
                ),
                'Congé / indisponibilité'
            ),

            nullif(
                leave_row.row_json->>'reason',
                ''
            ),

            (
                leave_row.leave_start_date::timestamp
                at time zone
                'Indian/Antananarivo'
            ),

            (
                (
                    leave_row.leave_end_date
                    + 1
                )::timestamp
                at time zone
                'Indian/Antananarivo'
            ),

            true,

            'personal'::text,

            case
                when lower(
                    coalesce(
                        leave_row.row_json->>'status',
                        'pending'
                    )
                ) in (
                    'pending',
                    'requested',
                    'submitted'
                )
                    then 'tentative'

                when lower(
                    coalesce(
                        leave_row.row_json->>'status',
                        'pending'
                    )
                ) in (
                    'approved',
                    'accepted'
                )
                    then 'confirmed'

                else coalesce(
                    nullif(
                        leave_row.row_json->>'status',
                        ''
                    ),
                    'confirmed'
                )
            end,

            null::text,
            'seller'::text,

            false,

            jsonb_build_object(
                'authority',
                'seller_personnel_leaves',

                'timezone',
                'Indian/Antananarivo',

                'all_day',
                true
            )

        from seller_leave_normalized leave_row

        where leave_row.leave_start_date is not null
          and leave_row.leave_end_date is not null
          and lower(
              coalesce(
                  leave_row.row_json->>'status',
                  'pending'
              )
          ) not in (
              'rejected',
              'refused',
              'declined',
              'cancelled',
              'canceled'
          )
    )

    select
        f.calendar_key,
        f.source_id,

        f.source_table,
        f.source_kind,
        f.relation_kind,

        f.title,
        f.description,

        f.starts_at,
        f.ends_at,
        f.all_day,

        f.event_type,
        f.status,

        f.location,
        f.context_role,

        f.editable,
        f.metadata

    from feed f

    where f.starts_at is not null

      and (
          p_from is null
          or f.ends_at >= p_from
      )

      and (
          p_to is null
          or f.starts_at < p_to
      )

    order by
        f.starts_at,
        f.title;
end;
$$;


revoke all
on function public.get_user_remaining_business_calendar_feed(
    timestamptz,
    timestamptz
)
from public;

revoke all
on function public.get_user_remaining_business_calendar_feed(
    timestamptz,
    timestamptz
)
from anon, authenticated;


comment on function public.get_user_remaining_business_calendar_feed(
    timestamptz,
    timestamptz
) is
'U-CAL-1B3 read-only projections: ticket/event relation, registrations, invitations, event sponsors, Marketplace bundles/partnerships, sponsor pipeline next actions and seller personnel leaves.';


-- ============================================================
-- PUBLIC UNIVERSAL FEED
--
-- Sources:
-- 1. U-CAL-1B base
-- 2. U-CAL-1B2 weekly training
-- 3. U-CAL-1B3 remaining business projections
--
-- calendar_key deduplication prevents the same parent event
-- appearing twice when a user has several independent
-- relationships to it.
-- ============================================================

create or replace function public.get_user_calendar_feed(
    p_from timestamptz default null,
    p_to timestamptz default null
)
returns table (
    calendar_key text,
    source_id uuid,

    source_table text,
    source_kind text,
    relation_kind text,

    title text,
    description text,

    starts_at timestamptz,
    ends_at timestamptz,
    all_day boolean,

    event_type text,
    status text,

    location text,
    context_role text,

    editable boolean,

    metadata jsonb
)
language sql
security definer
set search_path = public, pg_temp
as $$

    with combined as (

        select
            1::integer
                as source_priority,

            base_feed.*

        from public.get_user_calendar_feed_base(
            p_from,
            p_to
        ) base_feed


        union all


        select
            2::integer,

            training_feed.*

        from public.get_user_training_calendar_feed(
            p_from,
            p_to
        ) training_feed


        union all


        select
            3::integer,

            remaining_feed.*

        from public.get_user_remaining_business_calendar_feed(
            p_from,
            p_to
        ) remaining_feed
    ),

    deduplicated as (

        select distinct on (
            combined.calendar_key
        )

            combined.calendar_key,
            combined.source_id,

            combined.source_table,
            combined.source_kind,
            combined.relation_kind,

            combined.title,
            combined.description,

            combined.starts_at,
            combined.ends_at,
            combined.all_day,

            combined.event_type,
            combined.status,

            combined.location,
            combined.context_role,

            combined.editable,
            combined.metadata

        from combined

        order by
            combined.calendar_key,
            combined.source_priority
    )

    select
        deduplicated.*

    from deduplicated

    order by
        deduplicated.starts_at,
        deduplicated.title;
$$;


revoke all
on function public.get_user_calendar_feed(
    timestamptz,
    timestamptz
)
from public;

revoke all
on function public.get_user_calendar_feed(
    timestamptz,
    timestamptz
)
from anon;

grant execute
on function public.get_user_calendar_feed(
    timestamptz,
    timestamptz
)
to authenticated;


comment on function public.get_user_calendar_feed(
    timestamptz,
    timestamptz
) is
'Universal Indesy Mialy Agenda: personal manual items, business relations, weekly training recurrence and remaining safe U-CAL-1B3 projections. No business duplication and no invented fight datetime.';
