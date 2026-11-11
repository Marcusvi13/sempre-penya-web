-- Ajust coherent amb la classificació de duplicats a les aportacions manuals.
create or replace view public.archive_review_queue
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
       when m.decision='Acceptar incorporació' and m.status='Duplicat' then 'Possible duplicat'
       when m.decision='Acceptar incorporació' and m.linked_calendar_id is not null then 'Vinculat'
       when m.decision='Acceptar incorporació' then 'Validat'
       when m.decision in ('Ampliar registre existent','Corregir registre existent') and m.linked_calendar_id is null then 'Vincle pendent'
       when m.decision in ('Ampliar registre existent','Corregir registre existent') then 'Vinculat'
       else 'Pendent' end,
  (m.reviewed and m.decision <> 'Sense decidir'),m.linked_calendar_id,null::text,m.updated_at
from public.archive_manual_proposals m;


create or replace view public.archive_validated_calendar
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
  and m.day is not null and m.month is not null and m.linked_calendar_id is null
  and m.status <> 'Duplicat';

