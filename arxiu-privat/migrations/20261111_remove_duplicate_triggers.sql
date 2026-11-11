-- Eliminació de triggers d'auditoria duplicats introduïts a l'entorn de l'arxiu.
-- Es conserven els triggers originals archive_internal.* i la nova auditoria de coincidències.
drop trigger if exists archive_calendar_reviews_audit on public.archive_calendar_reviews;
drop trigger if exists archive_proposals_audit on public.archive_proposals;
drop trigger if exists archive_manual_proposals_audit on public.archive_manual_proposals;
drop trigger if exists archive_doubts_audit on public.archive_doubts;
drop trigger if exists archive_notes_audit on public.archive_notes;
