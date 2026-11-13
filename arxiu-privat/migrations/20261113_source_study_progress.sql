-- Fase 2 de l'Arxiu Històric de la Penya.
-- Seguiment editorial independent dels registres originals (sense alterar-los).
create table public.archive_source_studies (
 source_id text primary key references public.archive_sources(id),
 status text not null default 'pendent'
  check(status in ('pendent','lectura_parcial','estudiat','contrastat')),
 notes text not null default '',
 review_origin text not null default 'manual'
  check(review_origin in ('manual','lectura_assistida')),
 updated_by uuid,
 updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>=1)
);

create table public.archive_source_findings (
 id uuid primary key default gen_random_uuid(),
 source_id text not null references public.archive_sources(id),
 proposal_id text references public.archive_proposals(id),
 statement text not null check(length(btrim(statement))>=8),
 page_reference text not null default '',
 evidence_note text not null default '',
 assessment text not null default 'pista'
  check(assessment in ('pista','contradiccio','contrastat','descartat')),
 next_action text not null default '',
 origin text not null default 'manual'
  check(origin in ('manual','lectura_assistida')),
 updated_by uuid,
 updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>=1)
);
create index archive_source_findings_source_idx on public.archive_source_findings(source_id);
create index archive_source_findings_proposal_idx on public.archive_source_findings(proposal_id) where proposal_id is not null;

create or replace function archive_private.bump_source_study_version()
returns trigger language plpgsql set search_path='' as $$
begin
 new.version=old.version+1;
 new.updated_at=now();
 return new;
end;$$;
create trigger archive_source_studies_version before update on public.archive_source_studies
for each row execute function archive_private.bump_source_study_version();
create trigger archive_source_findings_version before update on public.archive_source_findings
for each row execute function archive_private.bump_source_study_version();

create trigger archive_source_studies_log after insert or update on public.archive_source_studies
for each row execute function archive_internal.log_archive_change();
create trigger archive_source_findings_log after insert or update on public.archive_source_findings
for each row execute function archive_internal.log_archive_change();

alter table public.archive_source_studies enable row level security;
alter table public.archive_source_findings enable row level security;
revoke all on public.archive_source_studies, public.archive_source_findings from public,anon,authenticated;
grant select,insert,update on public.archive_source_studies, public.archive_source_findings to authenticated;

create policy archive_source_studies_member_read on public.archive_source_studies
for select to authenticated using(exists (
 select 1 from public.archive_members m where m.user_id=(select auth.uid())));
create policy archive_source_findings_member_read on public.archive_source_findings
for select to authenticated using(exists (
 select 1 from public.archive_members m where m.user_id=(select auth.uid())));

create policy archive_source_studies_editor_insert on public.archive_source_studies
for insert to authenticated with check (
 updated_by=(select auth.uid()) and review_origin='manual'
 and exists(select 1 from public.archive_members m
  where m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create policy archive_source_studies_editor_update on public.archive_source_studies
for update to authenticated
using(exists(select 1 from public.archive_members m
 where m.user_id=(select auth.uid()) and m.role in ('owner','editor')))
with check (
 updated_by=(select auth.uid()) and review_origin='manual'
 and exists(select 1 from public.archive_members m
  where m.user_id=(select auth.uid()) and m.role in ('owner','editor')));

create policy archive_source_findings_editor_insert on public.archive_source_findings
for insert to authenticated with check(
 updated_by=(select auth.uid()) and origin='manual'
 and exists(select 1 from public.archive_members m
  where m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create policy archive_source_findings_editor_update on public.archive_source_findings
for update to authenticated
using(exists(select 1 from public.archive_members m
 where m.user_id=(select auth.uid()) and m.role in ('owner','editor')))
with check(
 updated_by=(select auth.uid()) and origin='manual'
 and exists(select 1 from public.archive_members m
  where m.user_id=(select auth.uid()) and m.role in ('owner','editor')));

comment on table public.archive_source_studies is 'Fase de lectura editorial, sense alterar les 136 fonts originals. Lectura assistida no equival a estudi complet.';
comment on table public.archive_source_findings is 'Pistes i contradiccions amb font, pàgina i proposta vinculada; no validen automàticament cap efemèride.';
