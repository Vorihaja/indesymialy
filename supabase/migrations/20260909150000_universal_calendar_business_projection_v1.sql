-- ============================================================
-- INDESY MIALY
-- U-CAL-1B CORE
--
-- Automatic business calendar projection.
--
-- No business event is copied into erp_calendar_items.
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

        union

        select distinct cm.organization_id
        from public.club_members cm
        where cm.profile_id = v_profile_id
          and cm.organization_id is not null
          and cm.left_at is null

        union

        select distinct ao.organization_id
        from public.active_organizations ao
        where ao.profile_id = v_profile_id
          and ao.organization_id is not null
    ),

    my_fighter_ids as (
        select f.id
        from public.fighters f
        where f.profile_id = v_profile_id
    ),

    linked_event_relations as (

        select
            ep.event_id,
            'participant'::text as relation_kind
        from public.event_participants ep
        where ep.profile_id = v_profile_id

        union all

        select
            ep.event_id,
            'organization_participant'::text
        from public.event_participants ep
        where ep.organization_id in (
            select organization_id
            from my_org_ids
        )

        union all

        select
            eoa.event_id,
            'event_official'::text
        from public.event_official_assignments eoa
        where eoa.profile_id = v_profile_id

        union all

        select
            sa.event_id,
            'event_staff'::text
        from public.staff_assignments sa
        where sa.profile_id = v_profile_id

        union all

        select
            esi.event_id,
            'schedule_responsible'::text
        from public.event_schedule_items esi
        where esi.responsible_profile_id = v_profile_id

        union all

        select
            irg.event_id,
            'internal_event_role'::text
        from public.event_internal_role_grants irg
        where irg.profile_id = v_profile_id
          and irg.revoked_at is null

        union all

        select
            ea.event_id,
            'accreditation'::text
        from public.event_accreditations ea
        where ea.profile_id = v_profile_id

        union all

        select
            efc.event_id,
            'fighter'::text
        from public.event_fight_cards efc
        where
            efc.fighter_red_id in (
                select id
                from my_fighter_ids
            )
            or
            efc.fighter_blue_id in (
                select id
                from my_fighter_ids
            )

        union all

        select
            fc.event_id,
            'fighter'::text
        from public.fight_card fc
        where fc.event_id is not null
          and (
              fc.fighter_a_id in (
                  select id
                  from my_fighter_ids
              )
              or
              fc.fighter_b_id in (
                  select id
                  from my_fighter_ids
              )
          )

        union all

        select
            f.event_id,
            'fight_official'::text
        from public.fight_official_assignments foa
        join public.fights f
          on f.id = foa.fight_id
        where foa.user_id = v_profile_id
          and f.event_id is not null

        union all

        select
            e.id,
            'organizer_organization'::text
        from public.events e
        where e.organizer_id in (
            select organization_id
            from my_org_ids
        )

        union all

        select
            eco.event_id,
            'coorganizer'::text
        from public.event_coorganizers eco
        where eco.organization_id in (
            select organization_id
            from my_org_ids
        )

        union all

        select
            wi.event_id,
            'fighter_weigh_in'::text
        from public.weigh_ins wi
        where wi.event_id is not null
          and wi.fighter_id in (
              select id
              from my_fighter_ids
          )
    ),

    linked_events as (
        select
            ler.event_id,

            string_agg(
                distinct ler.relation_kind,
                ','
                order by ler.relation_kind
            ) as relation_kind

        from linked_event_relations ler
        where ler.event_id is not null
        group by ler.event_id
    ),

    feed as (

        -- ====================================================
        -- PERSONAL
        -- ====================================================

        select
            'manual:' || item.id::text,
            item.id,

            'erp_calendar_items'::text,
            'manual'::text,
            'owner'::text,

            item.title,
            item.description,

            item.starts_at,
            item.ends_at,
            item.all_day,

            item.event_type,
            item.status,

            item.location,
            item.context_role,

            true,

            jsonb_build_object(
                'authority',
                'erp_calendar_items'
            )

        from public.erp_calendar_items item

        where item.owner_profile_id = v_profile_id
          and item.archived_at is null


        union all


        -- ====================================================
        -- LINKED EVENTS
        -- ====================================================

        select
            'event:' || e.id::text,
            e.id,

            'events'::text,
            'event'::text,
            le.relation_kind,

            coalesce(
                nullif(to_jsonb(e)->>'title', ''),
                nullif(to_jsonb(e)->>'name', ''),
                'Événement Indesy'
            ),

            nullif(
                to_jsonb(e)->>'description',
                ''
            ),

            e.starts_at,

            coalesce(
                e.ends_at,
                e.starts_at + interval '2 hours'
            ),

            false,

            'sport'::text,

            coalesce(
                nullif(to_jsonb(e)->>'status', ''),
                'confirmed'
            ),

            coalesce(
                nullif(to_jsonb(e)->>'location', ''),
                nullif(to_jsonb(e)->>'venue', '')
            ),

            null::text,
            false,

            jsonb_build_object(
                'event_id',
                e.id,
                'relations',
                le.relation_kind,
                'authority',
                'events'
            )

        from linked_events le

        join public.events e
          on e.id = le.event_id

        where e.starts_at is not null
          and e.archived_at is null


        union all


        -- ====================================================
        -- EVENT SCHEDULE RESPONSIBILITY
        -- ====================================================

        select
            'event_schedule:' || esi.id::text,
            esi.id,

            'event_schedule_items'::text,
            'event_schedule'::text,
            'responsible_profile'::text,

            esi.title,
            esi.notes,

            esi.starts_at,
            esi.ends_at,

            false,

            case
                when lower(esi.kind) in (
                    'fight',
                    'weigh_in',
                    'competition'
                )
                    then 'sport'

                when lower(esi.kind) in (
                    'travel',
                    'transport'
                )
                    then 'travel'

                when lower(esi.kind) in (
                    'deadline',
                    'checklist'
                )
                    then 'deadline'

                else 'meeting'
            end,

            esi.status,
            esi.location,

            null::text,
            false,

            jsonb_build_object(
                'event_id',
                esi.event_id,
                'authority',
                'event_schedule_items'
            )

        from public.event_schedule_items esi

        where esi.responsible_profile_id = v_profile_id


        union all


        -- ====================================================
        -- STAFF ASSIGNMENT
        -- ====================================================

        select
            'staff_assignment:' || sa.id::text,
            sa.id,

            'staff_assignments'::text,
            'staff_assignment'::text,
            'assigned_profile'::text,

            coalesce(
                nullif(to_jsonb(sa)->>'title', ''),
                nullif(to_jsonb(sa)->>'role', ''),
                'Affectation événement'
            ),

            nullif(
                to_jsonb(sa)->>'notes',
                ''
            ),

            sa.starts_at,

            coalesce(
                sa.ends_at,
                sa.starts_at + interval '1 hour'
            ),

            false,

            'meeting'::text,

            coalesce(
                nullif(to_jsonb(sa)->>'status', ''),
                'confirmed'
            ),

            nullif(
                to_jsonb(sa)->>'location',
                ''
            ),

            nullif(
                to_jsonb(sa)->>'role',
                ''
            ),

            false,

            jsonb_build_object(
                'event_id',
                sa.event_id,
                'authority',
                'staff_assignments'
            )

        from public.staff_assignments sa

        where sa.profile_id = v_profile_id
          and sa.starts_at is not null


        union all


        -- ====================================================
        -- WEIGH-IN
        -- ====================================================

        select
            'weigh_in:' || wi.id::text,
            wi.id,

            'weigh_ins'::text,
            'weigh_in'::text,
            'fighter'::text,

            'Pesée officielle'::text,

            nullif(
                to_jsonb(wi)->>'notes',
                ''
            ),

            wi.scheduled_at,
            wi.scheduled_at + interval '30 minutes',

            false,

            'medical'::text,

            coalesce(
                nullif(to_jsonb(wi)->>'status', ''),
                'confirmed'
            ),

            nullif(
                to_jsonb(wi)->>'location',
                ''
            ),

            'fighter'::text,
            false,

            jsonb_build_object(
                'event_id',
                wi.event_id,
                'fight_id',
                wi.fight_id,
                'fighter_id',
                wi.fighter_id,
                'authority',
                'weigh_ins'
            )

        from public.weigh_ins wi

        where wi.fighter_id in (
            select id
            from my_fighter_ids
        )
          and wi.scheduled_at is not null


        union all


        -- ====================================================
        -- SELLER AGENDA
        -- ====================================================

        select
            'seller_agenda:' || sai.id::text,
            sai.id,

            'seller_agenda_items'::text,
            'seller_agenda'::text,
            'seller_organization'::text,

            coalesce(
                nullif(to_jsonb(sai)->>'title', ''),
                'Agenda vendeur'
            ),

            nullif(
                to_jsonb(sai)->>'description',
                ''
            ),

            sai.starts_at,

            coalesce(
                sai.ends_at,
                sai.starts_at + interval '1 hour'
            ),

            sai.all_day,

            'commercial'::text,

            coalesce(
                nullif(to_jsonb(sai)->>'status', ''),
                'confirmed'
            ),

            nullif(
                to_jsonb(sai)->>'location',
                ''
            ),

            'seller'::text,
            false,

            jsonb_build_object(
                'organization_id',
                sai.organization_id,
                'authority',
                'seller_agenda_items'
            )

        from public.seller_agenda_items sai

        where sai.organization_id in (
            select organization_id
            from my_org_ids
        )
          and sai.starts_at is not null


        union all


        -- ====================================================
        -- SELLER PERSONNEL
        -- ====================================================

        select
            'seller_personnel_assignment:' || spa.id::text,
            spa.id,

            'seller_personnel_assignments'::text,
            'seller_personnel_assignment'::text,
            'assigned_profile'::text,

            coalesce(
                nullif(to_jsonb(spa)->>'title', ''),
                'Affectation vendeur'
            ),

            nullif(
                to_jsonb(spa)->>'notes',
                ''
            ),

            spa.starts_at,

            coalesce(
                spa.ends_at,
                spa.starts_at + interval '1 hour'
            ),

            false,

            'commercial'::text,

            coalesce(
                nullif(to_jsonb(spa)->>'status', ''),
                'confirmed'
            ),

            nullif(
                to_jsonb(spa)->>'location',
                ''
            ),

            'seller'::text,
            false,

            jsonb_build_object(
                'organization_id',
                spa.organization_id,
                'authority',
                'seller_personnel_assignments'
            )

        from public.seller_personnel_assignments spa

        where spa.profile_id = v_profile_id
          and spa.starts_at is not null


        union all


        -- ====================================================
        -- SELLER DOCUMENT EXPIRY
        -- ====================================================

        select
            'seller_document_expiry:' || spd.id::text,
            spd.id,

            'seller_personnel_documents'::text,
            'seller_document_expiry'::text,
            'document_owner'::text,

            coalesce(
                nullif(to_jsonb(spd)->>'title', ''),
                nullif(
                    to_jsonb(spd)->>'document_type',
                    ''
                ),
                'Expiration document'
            ),

            null::text,

            spd.expires_at,
            spd.expires_at + interval '30 minutes',

            false,

            'deadline'::text,
            'confirmed'::text,

            null::text,
            'seller'::text,
            false,

            jsonb_build_object(
                'organization_id',
                spd.organization_id,
                'authority',
                'seller_personnel_documents'
            )

        from public.seller_personnel_documents spd

        where spd.profile_id = v_profile_id
          and spd.expires_at is not null


        union all


        -- ====================================================
        -- MARKETPLACE PROMOTIONS
        -- ====================================================

        select
            'marketplace_promotion:' || mp.id::text,
            mp.id,

            'marketplace_promotions'::text,
            'marketplace_promotion'::text,
            'seller_organization'::text,

            coalesce(
                nullif(to_jsonb(mp)->>'name', ''),
                nullif(to_jsonb(mp)->>'title', ''),
                'Promotion Marketplace'
            ),

            nullif(
                to_jsonb(mp)->>'description',
                ''
            ),

            mp.starts_at,

            coalesce(
                mp.ends_at,
                mp.starts_at + interval '1 day'
            ),

            false,

            'commercial'::text,

            coalesce(
                nullif(to_jsonb(mp)->>'status', ''),
                'confirmed'
            ),

            null::text,
            'seller'::text,
            false,

            jsonb_build_object(
                'organization_id',
                mp.seller_organization_id,
                'authority',
                'marketplace_promotions'
            )

        from public.marketplace_promotions mp

        where mp.seller_organization_id in (
            select organization_id
            from my_org_ids
        )
          and mp.starts_at is not null


        union all


        -- ====================================================
        -- SPONSOR ACTIVATION
        -- ====================================================

        select
            'sponsor_activation:' || sac.id::text,
            sac.id,

            'sponsor_activations'::text,
            'sponsor_activation'::text,
            'owner_profile'::text,

            coalesce(
                nullif(to_jsonb(sac)->>'title', ''),
                nullif(to_jsonb(sac)->>'name', ''),
                'Activation sponsor'
            ),

            nullif(
                to_jsonb(sac)->>'description',
                ''
            ),

            sac.starts_at,

            coalesce(
                sac.ends_at,
                sac.starts_at + interval '1 hour'
            ),

            false,

            'commercial'::text,

            coalesce(
                nullif(to_jsonb(sac)->>'status', ''),
                'confirmed'
            ),

            nullif(
                to_jsonb(sac)->>'location',
                ''
            ),

            'sponsor'::text,
            false,

            jsonb_build_object(
                'authority',
                'sponsor_activations'
            )

        from public.sponsor_activations sac

        where sac.owner_profile_id = v_profile_id
          and sac.starts_at is not null


        union all


        -- ====================================================
        -- EVENT OPERATIONS
        -- ====================================================

        select
            'event_operation:' || eor.id::text,
            eor.id,

            'event_operation_records'::text,
            'event_operation'::text,
            'owner_profile'::text,

            coalesce(
                nullif(to_jsonb(eor)->>'title', ''),
                nullif(to_jsonb(eor)->>'label', ''),
                'Échéance opérationnelle'
            ),

            nullif(
                to_jsonb(eor)->>'description',
                ''
            ),

            eor.due_at,
            eor.due_at + interval '30 minutes',

            false,

            'deadline'::text,

            coalesce(
                nullif(to_jsonb(eor)->>'status', ''),
                'confirmed'
            ),

            nullif(
                to_jsonb(eor)->>'location',
                ''
            ),

            'organizer'::text,
            false,

            jsonb_build_object(
                'event_id',
                eor.event_id,
                'authority',
                'event_operation_records'
            )

        from public.event_operation_records eor

        where eor.owner_profile_id = v_profile_id
          and eor.due_at is not null


        union all


        -- ====================================================
        -- CLUB EVENTS
        -- ====================================================

        select
            'club_event:' || ce.id::text,
            ce.id,

            'club_events'::text,
            'club_event'::text,
            'organization_member'::text,

            coalesce(
                nullif(to_jsonb(ce)->>'title', ''),
                nullif(to_jsonb(ce)->>'name', ''),
                'Événement du club'
            ),

            nullif(
                to_jsonb(ce)->>'description',
                ''
            ),

            ce.event_date::timestamptz,

            ce.event_date::timestamptz
                + interval '1 day',

            true,

            'sport'::text,

            coalesce(
                nullif(to_jsonb(ce)->>'status', ''),
                'confirmed'
            ),

            nullif(
                to_jsonb(ce)->>'location',
                ''
            ),

            'club'::text,
            false,

            jsonb_build_object(
                'organization_id',
                ce.organization_id,
                'authority',
                'club_events'
            )

        from public.club_events ce

        where ce.organization_id in (
            select organization_id
            from my_org_ids
        )
          and ce.event_date is not null
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
        f.starts_at asc,
        f.title asc;
end;
$$;

revoke all
on function public.get_user_calendar_feed(
    timestamptz,
    timestamptz
)
from public;

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
'Universal calendar projection. Business records remain in their source authorities and are never copied into erp_calendar_items.';
