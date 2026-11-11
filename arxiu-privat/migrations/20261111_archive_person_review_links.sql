-- Revisió independent de persones i enllaços documentats amb les efemèrides.
-- Les 377 fitxes originals es mantenen intocades.
create table public.archive_people_reviews (
  person_id text primary key references public.archive_people(id) on delete cascade,
  decision text not null check (decision in ('Incloure','Excloure','Contrastar')),
  notes text not null default '',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version>=1)
);
alter table public.archive_people_reviews enable row level security;
create policy archive_people_reviews_member_read on public.archive_people_reviews
for select to authenticated
using (exists(select 1 from public.archive_members m where m.user_id=(select auth.uid())));
create policy archive_people_reviews_editor_insert on public.archive_people_reviews
for insert to authenticated
with check (exists(select 1 from public.archive_members m where m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create policy archive_people_reviews_editor_update on public.archive_people_reviews
for update to authenticated
using (exists(select 1 from public.archive_members m where m.user_id=(select auth.uid()) and m.role in ('owner','editor')))
with check (exists(select 1 from public.archive_members m where m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
grant select,insert on public.archive_people_reviews to authenticated;
grant update (decision,notes,updated_by,updated_at,version) on public.archive_people_reviews to authenticated;
create trigger archive_people_reviews_version
before insert or update on public.archive_people_reviews
for each row execute function archive_internal.update_calendar_review_version();

-- Una relació és sempre amb un registre concret que existeix (FK).
create table public.archive_person_event_links (
  id bigint generated always as identity primary key,
  person_id text not null references public.archive_people(id) on delete cascade,
  calendar_id text references public.archive_calendar_baseline(id) on delete cascade,
  proposal_id text references public.archive_proposals(id) on delete cascade,
  manual_id uuid references public.archive_manual_proposals(id) on delete cascade,
  relation text not null default 'Relacionat',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint archive_person_event_single_target check (
    num_nonnulls(calendar_id,proposal_id,manual_id)=1),
  constraint archive_person_calendar_unique unique(person_id,calendar_id),
  constraint archive_person_proposal_unique unique(person_id,proposal_id),
  constraint archive_person_manual_unique unique(person_id,manual_id)
);
create index archive_person_event_links_calendar on public.archive_person_event_links(calendar_id);
create index archive_person_event_links_proposal on public.archive_person_event_links(proposal_id);
create index archive_person_event_links_manual on public.archive_person_event_links(manual_id);
alter table public.archive_person_event_links enable row level security;
create policy archive_person_event_member_read on public.archive_person_event_links
for select to authenticated
using (exists(select 1 from public.archive_members m where m.user_id=(select auth.uid())));
create policy archive_person_event_editor_insert on public.archive_person_event_links
for insert to authenticated
with check (created_by=(select auth.uid()) and
  exists(select 1 from public.archive_members m where m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create policy archive_person_event_editor_delete on public.archive_person_event_links
for delete to authenticated
using (exists(select 1 from public.archive_members m where m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
grant select,insert,delete on public.archive_person_event_links to authenticated;

-- Auditoria existent, ampliada als nous objectes.
create or replace function archive_private.log_editorial_change()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare entity_key text;
begin
  if tg_op='UPDATE' and to_jsonb(new)=to_jsonb(old) then return new; end if;
  if tg_table_name='archive_calendar_reviews' then entity_key:=new.calendar_id;
  elsif tg_table_name='archive_people_reviews' then entity_key:=new.person_id;
  elsif tg_table_name='archive_proposal_matches' then entity_key:=new.proposal_id||'::'||new.calendar_id;
  else entity_key:=new.id::text;
  end if;
  insert into public.archive_change_log(entity_type,entity_id,change_type,old_value,new_value,performed_by)
  values(tg_table_name,entity_key,lower(tg_op),
    case when tg_op='INSERT' then null else to_jsonb(old) end,to_jsonb(new),auth.uid());
  return new;
end
$$;
revoke all on function archive_private.log_editorial_change() from public,anon,authenticated;
create trigger archive_people_reviews_audit
after insert or update on public.archive_people_reviews
for each row execute function archive_private.log_editorial_change();
create trigger archive_person_event_links_history
after insert or delete on public.archive_person_event_links
for each row execute function archive_internal.log_archive_change();
