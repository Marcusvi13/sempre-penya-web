-- Vincula a la font inventariada el PDF/Word original quan s'hagi pujat al bucket privat.
-- No modifica títol, text, autoria ni hash originals.
revoke update on public.archive_sources from public,anon,authenticated;
grant update(storage_path) on public.archive_sources to authenticated;

create policy archive_sources_editor_attach_original
on public.archive_sources for update to authenticated
using (
 exists (select 1 from public.archive_members m
  where m.user_id=(select auth.uid()) and m.role in ('owner','editor'))
 and storage_path is null
)
with check (
 exists (select 1 from public.archive_members m
  where m.user_id=(select auth.uid()) and m.role in ('owner','editor'))
 and storage_path like (select auth.uid())::text || '/archive-sources/' || id || '/%'
);

-- El registre inventariat només pot rebre el fitxer una vegada.
-- Canvis/reemplaçaments s'han de revisar explícitament en una migració posterior.
create function archive_private.guard_original_storage_path()
returns trigger language plpgsql
set search_path=''
as $$
begin
 if old.storage_path is not null and old.storage_path is distinct from new.storage_path then
  raise exception 'Aquest document original ja està vinculat a un fitxer. No se sobreescriu.';
 end if;
 return new;
end
$$;
create trigger archive_sources_original_path_guard
before update of storage_path on public.archive_sources
for each row execute function archive_private.guard_original_storage_path();
create trigger archive_sources_original_upload_history
after update of storage_path on public.archive_sources
for each row when (old.storage_path is distinct from new.storage_path)
execute function archive_internal.log_archive_change();

-- Si falla la vinculació a la fitxa després de pujar, permet netejar únicament
-- el fitxer d'aquest editor a la seva carpeta d'originals.
create policy archive_storage_cleanup_own_original
on storage.objects for delete to authenticated
using (
 bucket_id='arxiu-historic-privat'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and (storage.foldername(name))[2]='archive-sources'
 and exists(select 1 from public.archive_members m
  where m.user_id=(select auth.uid()) and m.role in ('owner','editor'))
);
