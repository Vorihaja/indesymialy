-- ============================================================
-- INDESY MIALY
-- U-CAL-1B2A
--
-- Weekly training recurrence in universal calendar.
--
-- Canonical contract:
--
--   training_sessions.day_of_week
--     ISO 8601 weekday
--     1 = Monday
--     2 = Tuesday
--     3 = Wednesday
--     4 = Thursday
--     5 = Friday
--     6 = Saturday
--     7 = Sunday
--
--   training_sessions.start_time / end_time
--     local wall-clock time in Indian/Antananarivo
--
-- No recurring occurrence is stored.
-- training_sessions remains the source of truth.
-- ============================================================


-- ============================================================
-- 1. EXISTING DATA SAFETY
--
-- Do not guess or silently convert legacy weekday values.
-- If a value outside ISO 1..7 exists, this migration fails
-- BEFORE any schema/function modification.
-- ============================================================

do $$
begin
    if exists (
        select 1
        from public.training_sessions ts
        where ts.day_of_week is not null
          and (
              ts.day_of_week < 1
              or ts.day_of_week > 7
          )
    ) then
        raise exception
            'U_CAL_1B2_DAY_CONVENTION_CONFLICT: training_sessions contains day_of_week outside ISO 1..7. No automatic conversion was performed.';
    end if;
end;
$$;


-- ============================================================
-- 2. CANONICAL WEEKDAY CONSTRAINT
-- ============================================================

do $$
begin
    if not exists (
        select 1
        from pg_constraint c
        where c.conname =
            'training_sessions_day_of_week_iso_check'
          and c.conrelid =
            'public.training_sessions'::regclass
    ) then
        alter table public.training_sessions
        add constraint training_sessions_day_of_week_iso_check
        check (
            day_of_week is null
            or day_of_week between 1 and 7
        );
    end if;
end;
$$;

comment on column public.training_sessions.day_of_week is
'ISO 8601 weekday. 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday.';

comment on column public.training_sessions.start_time is
'Local wall-clock start time interpreted in timezone Indian/Antananarivo.';

comment on column public.training_sessions.end_time is
'Local wall-clock end time interpreted in timezone Indian/Antananarivo.';


-- ============================================================
-- 3. PRESERVE U-CAL-1B AS INTERNAL BASE FEED
--
-- The public function keeps the same final name/signature.
-- We rename the existing implementation to an internal base,
-- then wrap it with weekly training projections.
-- ============================================================

alter function public.get_user_calendar_feed(
    timestamptz,
    timestamptz
)
rename to get_user_calendar_feed_base;

revoke all
on function public.get_user_calendar_feed_base(
    timestamptz,
    timestamptz
)
from public;

revoke all
on function public.get_user_calendar_feed_base(
    timestamptz,
    timestamptz
)
from anon, authenticated;


-- ============================================================
-- 4. TRAINING RECURRENCE PROJECTION
-- ============================================================

create or replace function public.get_user_training_calendar_feed(
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

    -- Recurrence expansion must always be bounded.
    -- FullCalendar normally supplies p_from/p_to.
    -- Defaults cover a useful calendar horizon when omitted.
    v_from timestamptz :=
        coalesce(
            p_from,
            now() - interval '31 days'
        );

    v_to timestamptz :=
        coalesce(
            p_to,
            now() + interval '366 days'
        );
begin
    if v_profile_id is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    if v_to <= v_from then
        raise exception 'INVALID_CALENDAR_RANGE';
    end if;

    return query

    with

    my_training_orgs as (

        -- Explicit club membership.
        select distinct
            cm.organization_id,
            'club_member'::text as relation_kind

        from public.club_members cm

        where cm.profile_id = v_profile_id
          and cm.organization_id is not null
          and cm.left_at is null


        union


        -- Generic organization membership.
        select distinct
            om.organization_id,
            'organization_member'::text

        from public.organization_members om

        where om.profile_id = v_profile_id
          and om.organization_id is not null
          and om.left_at is null
    ),

    related_training as (

        select
            ts.*,

            case
                when ts.coach_id = v_profile_id
                    then 'coach'

                when exists (
                    select 1
                    from public.club_members cm
                    where cm.profile_id = v_profile_id
                      and cm.organization_id =
                          ts.organization_id
                      and cm.left_at is null
                )
                    then 'club_member'

                else 'organization_member'
            end
                as calendar_relation_kind

        from public.training_sessions ts

        where ts.day_of_week between 1 and 7
          and ts.start_time is not null
          and ts.end_time is not null

          and (
              ts.coach_id = v_profile_id

              or ts.organization_id in (
                  select organization_id
                  from my_training_orgs
              )
          )
    ),

    occurrences as (

        select
            ts.*,

            series_day.occurrence_day::date
                as occurrence_date

        from related_training ts

        cross join lateral generate_series(
            v_from::date::timestamp,
            (
                (
                    v_to - interval '1 microsecond'
                )::date
            )::timestamp,
            interval '1 day'
        ) as series_day(
            occurrence_day
        )

        where extract(
            isodow
            from series_day.occurrence_day
        )::integer = ts.day_of_week
    ),

    projected as (

        select
            (
                'training:' ||
                occurrence.id::text ||
                ':' ||
                to_char(
                    occurrence.occurrence_date,
                    'YYYY-MM-DD'
                )
            )
                as calendar_key,

            occurrence.id
                as source_id,

            'training_sessions'::text
                as source_table,

            'training_session'::text
                as source_kind,

            occurrence.calendar_relation_kind
                as relation_kind,

            coalesce(
                nullif(
                    to_jsonb(occurrence)->>'title',
                    ''
                ),
                nullif(
                    to_jsonb(occurrence)->>'name',
                    ''
                ),
                case
                    when nullif(
                        to_jsonb(occurrence)->>'discipline',
                        ''
                    ) is not null
                        then
                            'Entraînement · ' ||
                            (
                                to_jsonb(occurrence)
                                ->>'discipline'
                            )

                    else
                        'Entraînement'
                end
            )
                as title,

            coalesce(
                nullif(
                    to_jsonb(occurrence)->>'description',
                    ''
                ),
                case
                    when nullif(
                        to_jsonb(occurrence)->>'coach_name',
                        ''
                    ) is not null
                        then
                            'Coach : ' ||
                            (
                                to_jsonb(occurrence)
                                ->>'coach_name'
                            )

                    else null
                end
            )
                as description,

            (
                (
                    occurrence.occurrence_date +
                    occurrence.start_time::time
                )
                at time zone
                'Indian/Antananarivo'
            )
                as starts_at,

            (
                (
                    occurrence.occurrence_date +
                    occurrence.end_time::time +
                    case
                        when occurrence.end_time::time
                             <= occurrence.start_time::time
                            then interval '1 day'

                        else interval '0'
                    end
                )
                at time zone
                'Indian/Antananarivo'
            )
                as ends_at,

            false
                as all_day,

            'sport'::text
                as event_type,

            coalesce(
                nullif(
                    to_jsonb(occurrence)->>'status',
                    ''
                ),
                'confirmed'
            )
                as status,

            nullif(
                to_jsonb(occurrence)->>'location',
                ''
            )
                as location,

            case
                when occurrence.calendar_relation_kind =
                     'coach'
                    then 'coach'

                else 'club'
            end
                as context_role,

            false
                as editable,

            jsonb_build_object(
                'authority',
                'training_sessions',

                'training_session_id',
                occurrence.id,

                'organization_id',
                occurrence.organization_id,

                'coach_id',
                occurrence.coach_id,

                'day_of_week',
                occurrence.day_of_week,

                'weekday_standard',
                'ISO_8601',

                'timezone',
                'Indian/Antananarivo',

                'recurrence',
                'weekly',

                'occurrence_date',
                occurrence.occurrence_date,

                'materialized',
                false
            )
                as metadata

        from occurrences occurrence
    )

    select
        projected.calendar_key,
        projected.source_id,

        projected.source_table,
        projected.source_kind,
        projected.relation_kind,

        projected.title,
        projected.description,

        projected.starts_at,
        projected.ends_at,
        projected.all_day,

        projected.event_type,
        projected.status,

        projected.location,
        projected.context_role,

        projected.editable,

        projected.metadata

    from projected

    where projected.starts_at < v_to
      and projected.ends_at >= v_from

    order by
        projected.starts_at,
        projected.title;
end;
$$;

revoke all
on function public.get_user_training_calendar_feed(
    timestamptz,
    timestamptz
)
from public;

revoke all
on function public.get_user_training_calendar_feed(
    timestamptz,
    timestamptz
)
from anon, authenticated;


-- ============================================================
-- 5. RECREATE PUBLIC UNIVERSAL FEED
--
-- Existing U-CAL-1B projections
-- +
-- dynamically generated training occurrences.
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
    select combined.*
    from (

        select base_feed.*
        from public.get_user_calendar_feed_base(
            p_from,
            p_to
        ) base_feed

        union all

        select training_feed.*
        from public.get_user_training_calendar_feed(
            p_from,
            p_to
        ) training_feed

    ) combined

    order by
        combined.starts_at,
        combined.title;
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


comment on function public.get_user_training_calendar_feed(
    timestamptz,
    timestamptz
) is
'Read-only weekly projection of training_sessions into the universal calendar. ISO weekday 1=Monday..7=Sunday. Local timezone Indian/Antananarivo. No occurrence materialization.';

comment on function public.get_user_calendar_feed(
    timestamptz,
    timestamptz
) is
'Universal Indesy Mialy calendar feed: U-CAL business sources plus dynamically projected weekly training sessions.';
