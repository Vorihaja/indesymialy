begin;

create or replace function public.transition_sponsor_pipeline(p_pipeline_id uuid, p_stage text, p_note text default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_row public.sponsor_pipeline%rowtype;
begin
  select * into v_row from public.sponsor_pipeline where id = p_pipeline_id for update;
  if v_row.id is null then raise exception 'Prospect introuvable.'; end if;
  if not public.can_manage_organization(v_row.organization_id) then raise exception 'Accès refusé.'; end if;
  if p_stage = v_row.stage then return v_row.id; end if;
  if not (
    (v_row.stage = 'lead' and p_stage in ('contacted','archived')) or
    (v_row.stage = 'contacted' and p_stage in ('qualified','lost','archived')) or
    (v_row.stage = 'qualified' and p_stage in ('proposal','lost')) or
    (v_row.stage = 'proposal' and p_stage in ('negotiation','won','lost')) or
    (v_row.stage = 'negotiation' and p_stage in ('won','lost','proposal')) or
    (v_row.stage = 'lost' and p_stage in ('contacted','archived'))
  ) then raise exception 'Transition commerciale invalide : % vers %.', v_row.stage, p_stage; end if;
  if p_stage = 'lost' and length(btrim(coalesce(p_note, v_row.lost_reason, ''))) < 2 then raise exception 'Le motif de perte est obligatoire.'; end if;
  if p_stage = 'won' and v_row.event_id is null then raise exception 'Un événement est obligatoire pour convertir ce prospect.'; end if;

  update public.sponsor_pipeline
  set stage = p_stage,
      lost_reason = case when p_stage='lost' then coalesce(nullif(btrim(p_note),''),lost_reason) else null end,
      updated_at=now()
  where id=p_pipeline_id;

  if p_stage = 'won' then
    insert into public.event_sponsors(event_id,sponsor_id,amount,status,created_by,created_at,updated_at)
    values(v_row.event_id,v_row.sponsor_id,coalesce(v_row.estimated_value,0),'contracted',auth.uid(),now(),now())
    on conflict (event_id,sponsor_id) do update
    set amount=excluded.amount,status='contracted',updated_at=now();
  end if;

  insert into public.sponsor_pipeline_history(pipeline_id,from_stage,to_stage,note,changed_by)
  values(p_pipeline_id,v_row.stage,p_stage,nullif(btrim(p_note),''),auth.uid());
  return p_pipeline_id;
end $$;

commit;
