-- Materials i fonts annexos a qualsevol fitxa de l'Arxiu Històric.
-- Sense alterar cap dada original ni cap decisió editorial.
create table public.archive_research_materials (
  id uuid primary key default gen_random_uuid(),
  target_kind text not null check (target_kind in
    ('calendar','proposal','manual','person','source','chapter','dossier','doubt','catalogue')),
  target_id text not null check (length(btrim(target_id)) between 1 and 150),
  material_type text not null check (material_type in ('link','file','reference')),
  title text not null check (length(btrim(title)) between 3 and 300),
  url text,
  file_path text unique,
  file_name text,
  file_size bigint,
  mime_type text,
  description text not null default '',
  source_author text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  constraint archive_research_material_type_check check (
   (material_type='link' and url is not null and file_path is null)
   or (material_type='file' and file_path is not null and url is null)
   or (material_type='reference' and url is null and file_path is null)
  ),
  constraint archive_research_url_check check (
    url is null or (length(url) between 8 and 2048 and url ~* '^https://[^[:space:]]+$')
  ),
  constraint archive_research_size_check check (
    file_size is null or (file_size between 1 and 20971520)
  ),
  constraint archive_research_file_path_check check (
    file_path is null or (
      length(file_path) <= 350
      and file_path like created_by::text || '/research/%'
    )
  )
);
create index archive_materials_target on public.archive_research_materials
  (target_kind,target_id,created_at desc);
create index archive_materials_added on public.archive_research_materials (created_at desc);
alter table public.archive_research_materials enable row level security;
create policy archive_materials_member_read on public.archive_research_materials
for select to authenticated
using (exists (select 1 from public.archive_members m where m.user_id=(select auth.uid())));
create policy archive_materials_editor_insert on public.archive_research_materials
for insert to authenticated
with check (
  created_by=(select auth.uid()) and
  exists (select 1 from public.archive_members m where m.user_id=(select auth.uid())
   and m.role in ('owner','editor'))
);
create policy archive_materials_editor_archive on public.archive_research_materials
for update to authenticated
using (exists (select 1 from public.archive_members m where m.user_id=(select auth.uid())
   and m.role in ('owner','editor')))
with check (exists (select 1 from public.archive_members m where m.user_id=(select auth.uid())
   and m.role in ('owner','editor')));
grant select,insert on public.archive_research_materials to authenticated;
grant update (archived_at,archived_by) on public.archive_research_materials to authenticated;
create trigger archive_materials_history after insert or update
on public.archive_research_materials
for each row execute function archive_internal.log_archive_change();

-- El bucket privat ja existeix i té polítiques de lectura i pujada per als membres.
-- Aquesta política addicional només permet netejar un fitxer acabat de pujar
-- per l'editor propietari si falla l'alta de metadades, sota la carpeta research.
create policy archive_storage_cleanup_own_research on storage.objects
for delete to authenticated
using (
  bucket_id = 'arxiu-historic-privat'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'research'
  and exists (select 1 from public.archive_members m
    where m.user_id=(select auth.uid()) and m.role in ('owner','editor'))
);
