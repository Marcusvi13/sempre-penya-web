-- Afegim la clau source_id al logger d'auditoria reutilitzat.
-- Canvi només per a tables amb source_id i sense id/calendar_id.
create or replace function archive_internal.log_archive_change()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
 _id text;
 _old jsonb;
 _new jsonb;
begin
 if tg_op='DELETE' then
  _id:=coalesce(to_jsonb(old)->>'id',to_jsonb(old)->>'calendar_id',to_jsonb(old)->>'source_id');
  _old:=to_jsonb(old);
  _new:=null;
 else
  _id:=coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'calendar_id',to_jsonb(new)->>'source_id');
  _old:=case when tg_op='UPDATE' then to_jsonb(old) else null end;
  _new:=to_jsonb(new);
 end if;
 insert into public.archive_change_log(entity_type,entity_id,change_type,old_value,new_value,performed_by)
 values(tg_table_name,coalesce(_id,''),tg_op,_old,_new,auth.uid());
 return case when tg_op='DELETE' then old else new end;
end;
$function$;
-- Reparació exclusivament dels identificadors incomplets dels 8 registres
-- acabats de crear; no es canvia cap fet, data, autor, tipus ni cos del log.
update public.archive_change_log
set entity_id=new_value->>'source_id'
where entity_type='archive_source_studies'
 and entity_id=''
 and (new_value ? 'source_id');
