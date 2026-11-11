-- Permet notes independents per als dossiers sense barrejar-les amb les de les fonts bibliogràfiques.
alter table public.archive_notes drop constraint archive_notes_target_kind_check;
alter table public.archive_notes add constraint archive_notes_target_kind_check
check (target_kind in ('calendar','person','chapter','source','proposal','doubt','catalogue','dossier'));