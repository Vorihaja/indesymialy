-- ============================================================
-- INDESY MIALY
-- U-CAL RUNTIME COLUMN CONTRACT FIX
--
-- PostgreSQL derives unnamed CTE columns from the first SELECT.
-- The base feed starts with the expression
-- 'manual:' || item.id::text without an alias, so its first
-- output column is not named calendar_key. Later references to
-- f.calendar_key consequently fail at runtime.
--
-- The audited feeds return exactly 16 compatible columns in the
-- canonical order below:
--   base feed:      12 UNION ALL branches
--   remaining feed: 5 UNION ALL branches
--
-- This migration preserves each deployed function body and adds
-- an explicit CTE column contract. No business row is copied and
-- no calendar authority is changed.
-- ============================================================

do $migration$
declare
    v_signature regprocedure;
    v_definition text;
    v_occurrence_count integer;

    v_needle constant text := E'    feed as (';

    v_column_contract constant text := E'    feed (\n'
        || E'        calendar_key,\n'
        || E'        source_id,\n'
        || E'        source_table,\n'
        || E'        source_kind,\n'
        || E'        relation_kind,\n'
        || E'        title,\n'
        || E'        description,\n'
        || E'        starts_at,\n'
        || E'        ends_at,\n'
        || E'        all_day,\n'
        || E'        event_type,\n'
        || E'        status,\n'
        || E'        location,\n'
        || E'        context_role,\n'
        || E'        editable,\n'
        || E'        metadata\n'
        || E'    ) as (';
begin
    foreach v_signature in array array[
        'public.get_user_calendar_feed_base(timestamp with time zone,timestamp with time zone)'::regprocedure,
        'public.get_user_remaining_business_calendar_feed(timestamp with time zone,timestamp with time zone)'::regprocedure
    ]
    loop
        v_definition := pg_get_functiondef(v_signature);

        v_occurrence_count :=
            (
                length(v_definition)
                - length(replace(v_definition, v_needle, ''))
            ) / length(v_needle);

        if v_occurrence_count <> 1 then
            raise exception
                'U_CAL_FEED_CONTRACT_UNEXPECTED_DEFINITION: % contains % feed CTE marker(s)',
                v_signature::text,
                v_occurrence_count;
        end if;

        execute replace(
            v_definition,
            v_needle,
            v_column_contract
        );

        if position(
            v_column_contract
            in pg_get_functiondef(v_signature)
        ) = 0 then
            raise exception
                'U_CAL_FEED_CONTRACT_NOT_APPLIED: %',
                v_signature::text;
        end if;
    end loop;
end;
$migration$;

-- Preserve the internal/read-only execution boundary.
revoke all
on function public.get_user_calendar_feed_base(
    timestamptz,
    timestamptz
)
from public, anon, authenticated;

revoke all
on function public.get_user_remaining_business_calendar_feed(
    timestamptz,
    timestamptz
)
from public, anon, authenticated;

comment on function public.get_user_calendar_feed_base(
    timestamptz,
    timestamptz
) is
'Internal Universal Calendar base projection with an explicit 16-column feed contract.';

comment on function public.get_user_remaining_business_calendar_feed(
    timestamptz,
    timestamptz
) is
'U-CAL remaining read-only business projections with an explicit 16-column feed contract.';
