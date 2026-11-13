-- Arxiu Històric: versions alternatives de pàgines PDF originals.
-- No reescriu archive_sources, els SHA-256 originals ni les decisions editorials.
create table if not exists public.archive_source_variants (
 id uuid primary key default gen_random_uuid(),
 source_id text not null unique references public.archive_sources(id),
 storage_path text not null unique,
 file_name text not null check (lower(file_name) like '%.pdf'),
 actual_sha256 text not null check (actual_sha256 ~ '^[a-f0-9]{64}$'),
 actual_bytes bigint not null check (actual_bytes between 1 and 52428800),
 review_note text not null default '',
 reviewed_by uuid not null default auth.uid(),
 reviewed_at timestamptz not null default now(),
 constraint source_variant_private_path check
  (storage_path like reviewed_by::text || '/archive-sources/' || source_id || '/%')
);

alter table public.archive_source_variants enable row level security;
revoke all on table public.archive_source_variants from public, anon, authenticated;
grant select, insert on table public.archive_source_variants to authenticated;

create policy archive_source_variants_members_read
on public.archive_source_variants for select to authenticated
using (exists (
 select 1 from public.archive_members m where m.user_id=(select auth.uid())
));

create policy archive_source_variants_editor_insert
on public.archive_source_variants for insert to authenticated
with check (
 reviewed_by=(select auth.uid())
 and exists (
  select 1 from public.archive_members m
  where m.user_id=(select auth.uid()) and m.role in ('owner','editor')
 )
 and exists (
  select 1 from storage.objects o
  where o.bucket_id='arxiu-historic-privat'
   and o.name=storage_path
   and (o.metadata->>'size')::bigint=actual_bytes
 )
 and exists (
  select 1 from public.archive_sources s
  where s.id=source_id and s.storage_path is null
 )
);

create trigger archive_source_variants_log_insert
after insert on public.archive_source_variants
for each row execute function archive_internal.log_archive_change();

comment on table public.archive_source_variants is
 'Versió alternativa de PDF comparada manualment amb una font inventariada; els hashes de l’original i del fitxer pujat poden ser diferents.';
