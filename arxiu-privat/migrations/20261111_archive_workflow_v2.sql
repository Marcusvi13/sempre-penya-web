-- Arxiu Històric de la Penya — revisió editorial v2
-- Només projecte Supabase lfmudiewyupfvtmlgpse. Sense modificar registres originals.
alter table public.archive_calendar_reviews
  add column corrected_title text,
  add column corrected_kind text,
  add column corrected_year text,
  add column corrected_day smallint,
  add column corrected_month smallint,
  add column merged_into_calendar_id text references public.archive_calendar_baseline(id);

alter table public.archive_calendar_reviews
  add constraint archive_reviews_decision_check
    check (proposed_decision in ('Conservar','Corregir','Descartar','Fusionar','Contrastar')),
  add constraint archive_reviews_date_pair_check
    check ((corrected_day is null) = (corrected_month is null)),
  add constraint archive_reviews_day_check
    check (corrected_day is null or corrected_day between 1 and 31),
  add constraint archive_reviews_month_check
    check (corrected_month is null or corrected_month between 1 and 12),
  add constraint archive_reviews_merge_check
    check (proposed_decision <> 'Fusionar' or
      (merged_into_calendar_id is not null and merged_into_calendar_id <> calendar_id)),
  add constraint archive_reviews_correction_check
    check (proposed_decision <> 'Corregir' or
      nullif(btrim(corrected_title),'') is not null or
      nullif(btrim(corrected_kind),'') is not null or
      nullif(btrim(corrected_year),'') is not null or
      corrected_day is not null);

grant update (proposed_decision,rationale,updated_by,updated_at,version,
  corrected_title,corrected_kind,corrected_year,corrected_day,corrected_month,merged_into_calendar_id)
on public.archive_calendar_reviews to authenticated;
grant insert on public.archive_notes to authenticated;
grant update (decision,notes,reviewed,linked_calendar_id,updated_at)
on public.archive_manual_proposals to authenticated;
grant update (linked_calendar_id) on public.archive_proposals to authenticated;
grant update (confirmed_by_editor) on public.archive_proposal_matches to authenticated;

-- Safata de revisió, amb les tres fonts sense modificar els originals.
create view public.archive_review_queue
with (security_invoker = true) as
select
  'calendar:'||c.id as item_key, 'calendar'::text as origin, c.id as record_id,
  c.title, c.day, c.month, c.historic_year, c.kind,
  c.source_url as source_label, null::text as source_state,
  c.editorial_decision_original as original_decision,
  coalesce(r.proposed_decision,'Sense decidir') as decision,
  case when r.calendar_id is null then 'Pendent'
       when r.proposed_decision in ('Conservar','Corregir') then 'Validat'
       when r.proposed_decision='Descartar' then 'Descartat'
       when r.proposed_decision='Fusionar' then 'Fusionat'
       when r.proposed_decision='Contrastar' then 'En contrast'
       else 'Pendent' end as workflow_state,
  (r.calendar_id is not null) as reviewed,
  r.merged_into_calendar_id as linked_calendar_id,
  null::text as priority, r.updated_at
from public.archive_calendar_baseline c
left join public.archive_calendar_reviews r on r.calendar_id=c.id
union all
select
  'proposal:'||p.id, 'proposal'::text, p.id,
  p.title, p.day, p.month, p.historic_year, p.kind,
  p.source_label,p.status,
  null::text,p.decision,
  case when not p.reviewed or p.decision='Sense decidir' then 'Pendent'
       when p.decision='Descartar proposta' then 'Descartat'
       when p.decision='Demanar contrast' then 'En contrast'
       when p.decision='Acceptar incorporació' and (p.day is null or p.month is null) then 'Sense data'
       when p.decision='Acceptar incorporació' and p.status='Duplicat' then 'Possible duplicat'
       when p.decision='Acceptar incorporació' and p.linked_calendar_id is not null then 'Vinculat'
       when p.decision='Acceptar incorporació' then 'Validat'
       when p.decision in ('Ampliar registre existent','Corregir registre existent') and p.linked_calendar_id is null then 'Vincle pendent'
       when p.decision in ('Ampliar registre existent','Corregir registre existent') then 'Vinculat'
       else 'Pendent' end,
  (p.reviewed and p.decision <> 'Sense decidir'),p.linked_calendar_id,p.priority,p.updated_at
from public.archive_proposals p
union all
select
  'manual:'||m.id::text, 'manual'::text, m.id::text,
  m.title, m.day, m.month, m.historic_year, m.kind,
  m.source_id,m.status,
  null::text,m.decision,
  case when not m.reviewed or m.decision='Sense decidir' then 'Pendent'
       when m.decision='Descartar proposta' then 'Descartat'
       when m.decision='Demanar contrast' then 'En contrast'
       when m.decision='Acceptar incorporació' and (m.day is null or m.month is null) then 'Sense data'
       when m.decision='Acceptar incorporació' and m.linked_calendar_id is not null then 'Vinculat'
       when m.decision='Acceptar incorporació' then 'Validat'
       when m.decision in ('Ampliar registre existent','Corregir registre existent') and m.linked_calendar_id is null then 'Vincle pendent'
       when m.decision in ('Ampliar registre existent','Corregir registre existent') then 'Vinculat'
       else 'Pendent' end,
  (m.reviewed and m.decision <> 'Sense decidir'),m.linked_calendar_id,null::text,m.updated_at
from public.archive_manual_proposals m;

-- La selecció final és derivada de decisions explícites.
-- Les propostes sense data, les marcades duplicat i les ja vinculades NO s'incorporen automàticament.
create view public.archive_validated_calendar
with (security_invoker = true) as
select
  'calendar:'||c.id as item_key, 'calendar'::text as origin, c.id as record_id,
  case when r.proposed_decision='Corregir' then coalesce(nullif(btrim(r.corrected_title),''),c.title) else c.title end as title,
  case when r.proposed_decision='Corregir' then coalesce(r.corrected_day,c.day) else c.day end as day,
  case when r.proposed_decision='Corregir' then coalesce(r.corrected_month,c.month) else c.month end as month,
  case when r.proposed_decision='Corregir' then coalesce(nullif(btrim(r.corrected_year),''),c.historic_year) else c.historic_year end as historic_year,
  case when r.proposed_decision='Corregir' then coalesce(nullif(btrim(r.corrected_kind),''),c.kind) else c.kind end as kind,
  c.source_url as source_label, r.proposed_decision as decision, r.updated_at
from public.archive_calendar_baseline c
join public.archive_calendar_reviews r on r.calendar_id=c.id
where r.proposed_decision in ('Conservar','Corregir')
union all
select 'proposal:'||p.id, 'proposal'::text,p.id,
  p.title,p.day,p.month,p.historic_year,p.kind,p.source_label,p.decision,p.updated_at
from public.archive_proposals p
where p.reviewed and p.decision='Acceptar incorporació'
  and p.day is not null and p.month is not null
  and p.linked_calendar_id is null and p.status <> 'Duplicat'
union all
select 'manual:'||m.id::text,'manual'::text,m.id::text,
  m.title,m.day,m.month,m.historic_year,m.kind,m.source_id,m.decision,m.updated_at
from public.archive_manual_proposals m
where m.reviewed and m.decision='Acceptar incorporació'
  and m.day is not null and m.month is not null and m.linked_calendar_id is null;

revoke all on public.archive_review_queue from public,anon;
revoke all on public.archive_validated_calendar from public,anon;
grant select on public.archive_review_queue,public.archive_validated_calendar to authenticated;

-- Registre automàtic i només de lectura des de la web.
-- Funció privada NO exposada a la Data API, únicament activada per triggers.
create schema if not exists archive_private;
revoke all on schema archive_private from public,anon,authenticated;
create function archive_private.log_editorial_change()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare entity_key text;
begin
  if tg_op='UPDATE' and to_jsonb(new)=to_jsonb(old) then return new; end if;
  if tg_table_name='archive_calendar_reviews' then entity_key:=new.calendar_id;
  elsif tg_table_name='archive_proposal_matches' then entity_key:=new.proposal_id||'::'||new.calendar_id;
  else entity_key:=new.id::text;
  end if;
  insert into public.archive_change_log
    (entity_type,entity_id,change_type,old_value,new_value,performed_by)
  values
    (tg_table_name,entity_key,lower(tg_op),
     case when tg_op='INSERT' then null else to_jsonb(old) end,
     to_jsonb(new),auth.uid());
  return new;
end
$$;
revoke all on function archive_private.log_editorial_change() from public,anon,authenticated;

create trigger archive_calendar_reviews_audit
after insert or update on public.archive_calendar_reviews
for each row execute function archive_private.log_editorial_change();
create trigger archive_proposals_audit
after update on public.archive_proposals
for each row execute function archive_private.log_editorial_change();
create trigger archive_manual_proposals_audit
after insert or update on public.archive_manual_proposals
for each row execute function archive_private.log_editorial_change();
create trigger archive_proposal_matches_audit
after update on public.archive_proposal_matches
for each row execute function archive_private.log_editorial_change();
create trigger archive_doubts_audit
after update on public.archive_doubts
for each row execute function archive_private.log_editorial_change();
create trigger archive_notes_audit
after insert on public.archive_notes
for each row execute function archive_private.log_editorial_change();
