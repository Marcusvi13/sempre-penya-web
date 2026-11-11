-- Enduriment de privilegis: RLS + concessions mínimes per columna.
-- Les concessions per defecte de public poden incloure UPDATE i SELECT per a anon.
revoke all on table public.archive_research_materials from public,anon,authenticated;
grant select,insert on table public.archive_research_materials to authenticated;
grant update (archived_at,archived_by) on table public.archive_research_materials to authenticated;
