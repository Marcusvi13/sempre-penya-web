-- Cerca documental transversal. Vista de consulta, mai modifica ni fusiona registres.
create view public.archive_global_search with (security_invoker=true) as
select 'calendar:'||id as item_key,'calendar'::text as origin,id as record_id,
 title,day,month,historic_year,kind,'Calendari'::text as section from public.archive_calendar_baseline
union all
select 'proposal:'||id,'proposal'::text,id,title,day,month,historic_year,kind,
 'Propostes'::text from public.archive_proposals
union all
select 'manual:'||id::text,'manual'::text,id::text,title,day,month,historic_year,kind,
 'Aportacions pròpies'::text from public.archive_manual_proposals
union all
select 'person:'||id,'person'::text,id,name,null::smallint,null::smallint,
 null::text,category,'Persones'::text from public.archive_people
union all
select 'source:'||id,'source'::text,id,title,null::smallint,null::smallint,
 null::text,kind,'Fonts'::text from public.archive_sources
union all
select 'chapter:'||id,'chapter'::text,id,title,null::smallint,null::smallint,
 null::text,thematic_type,'Capítols'::text from public.archive_chapters
union all
select 'dossier:'||id,'dossier'::text,id,title,null::smallint,null::smallint,
 null::text,thematic_type,'Dossiers'::text from public.archive_dossiers
union all
select 'doubt:'||id,'doubt'::text,id,title,null::smallint,null::smallint,
 null::text,status,'Dubtes'::text from public.archive_doubts
union all
select 'catalogue:'||id,'catalogue'::text,id,title,day,month,historic_year,kind,
 'Catàleg de referència'::text from public.archive_reference_catalogue;
revoke all on public.archive_global_search from public,anon;
grant select on public.archive_global_search to authenticated;
