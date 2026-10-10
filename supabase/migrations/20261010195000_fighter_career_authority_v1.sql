begin;

alter table public.elo_history
enable row level security;

drop policy if exists elo_history_public_read
on public.elo_history;

create policy elo_history_public_read
on public.elo_history
for select
to anon, authenticated
using (true);

revoke all
on table public.elo_history
from anon, authenticated, service_role;

grant select
on table public.elo_history
to anon, authenticated;

grant select, insert, update, delete
on table public.elo_history
to service_role;

create table if not exists public.fighter_career_contracts (
    id uuid primary key default gen_random_uuid(),

    fighter_id uuid not null
        references public.fighters(id)
        on delete cascade,

    reference text not null,
    contract_type text not null,
    status text not null,

    start_date date not null,
    end_date date,

    counterparty text,

    amount numeric(18, 2),
    currency text,

    details jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists
fighter_career_contracts_fighter_start_idx
on public.fighter_career_contracts(
    fighter_id,
    start_date desc
);

alter table public.fighter_career_contracts
enable row level security;

drop policy if exists fighter_career_contracts_own_read
on public.fighter_career_contracts;

create policy fighter_career_contracts_own_read
on public.fighter_career_contracts
for select
to authenticated
using (
    exists (
        select 1
        from public.fighters f
        where f.id = fighter_id
          and f.profile_id = auth.uid()
    )
);

revoke all
on table public.fighter_career_contracts
from anon, authenticated;

grant select
on table public.fighter_career_contracts
to authenticated;

grant select, insert, update, delete
on table public.fighter_career_contracts
to service_role;

comment on table public.fighter_career_contracts is
'Canonical read authority for contracts displayed in the personal Fighter Career ERP module.';

commit;