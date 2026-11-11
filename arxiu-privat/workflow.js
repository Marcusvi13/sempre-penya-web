/* Arxiu Històric Penya — navegació i safata unificada.
   Carrega DESPRÉS del gestor original: reutilitza la sessió i els permisos ja validats. */
(function(){
'use strict';
const get=id=>document.getElementById(id);
const queue='archive_review_queue',valid='archive_validated_calendar',history='archive_change_log';
views[queue]={
 title:'Safata de revisió',
 description:'Totes les efemèrides inicials, propostes documentals i aportacions. Les decisions no alteren les fonts originals.',
 fields:'item_key,origin,record_id,title,day,month,historic_year,kind,source_label,source_state,original_decision,decision,workflow_state,reviewed,linked_calendar_id,priority,updated_at'
};
views[valid]={
 title:'Calendari validat',
 description:'Només registres amb aprovació editorial explícita i data completa; les fusions i els duplicats no hi entren automàticament.',
 fields:'item_key,origin,record_id,title,day,month,historic_year,kind,source_label,decision,updated_at'
};
views[history]={
 title:'Historial de canvis',
 description:'Registre automàtic i només de lectura de les decisions i aportacions.',
 fields:'id,entity_type,entity_id,change_type,changed_at,performed_by'
};
views.archive_dossiers={
 title:'Dossiers',
 description:'Documents de context que no s’incorporen automàticament com a efemèrides.',
 fields:'id,title,thematic_type'
};

const mainNavigation=[
 {title:'Safata de revisió',view:queue,group:'review'},
 {title:'Calendari original',view:'archive_calendar_baseline',group:'calendar'},
 {title:'Calendari validat',view:valid,group:'validated'},
 {title:'Persones',view:'archive_people',group:'people'},
 {title:'Biblioteca i fonts',view:'archive_sources',group:'library'},
 {title:'Seguiment',view:'archive_doubts',group:'tracking'},
 {title:'+ Nova proposta',view:'archive_manual_proposals',group:'new'}
];
const subdivisions={
 library:[
  {title:'Fonts',view:'archive_sources'},
  {title:'Capítols',view:'archive_chapters'},
  {title:'Dossiers',view:'archive_dossiers'},
  {title:'Catàleg ampliat',view:'archive_reference_catalogue'}],
 tracking:[
  {title:'Dubtes',view:'archive_doubts'},
  {title:'Historial',view:history}]
};
const labelOrigin=o=>({calendar:'Calendari original',proposal:'Proposta documental',manual:'Aportació pròpia'})[o]||o;
const isUnified=()=>view===queue||view===valid;
const slugSafe=t=>String(t||'').replace(/[%_,()]/g,'').trim();
const isEditor=()=>role==='owner'||role==='editor';
const itemDate=r=>r.day&&r.month?String(r.day).padStart(2,'0')+'/'+String(r.month).padStart(2,'0')+(r.historic_year?' · '+r.historic_year:''):(r.historic_year?'Any '+r.historic_year+' · sense dia i mes':'Data pendent');
function tag(textValue,tone){
 const s=document.createElement('span');s.className='record-tag'+(tone?' '+tone:'');s.textContent=textValue;return s;
}
const originalLoadData=loadData;
const originalRenderRows=renderRows;
const originalRenderDetail=renderDetail;
const originalSetView=setView;
const originalLoadStats=loadStats;
const wf=window.ArchiveWorkflow={
 get,tag,itemDate,labelOrigin,isEditor,
 showRecord:function(record){get('detail').textContent=record?'Carregant la fitxa…':'Selecciona una efemèride.'},
 showExisting:function(){},
 openRecord:function(origin,id,title){
  wf.showRecord({origin,record_id:String(id),title:title||String(id),item_key:origin+':'+id});
  get('detail').scrollIntoView({behavior:'smooth',block:'nearest'});
 },
 refresh:function(){return loadData()},
 showError:function(message){notify(message,'error')},
 afterSaved:async function(message){
  if(view===queue||view===valid)await loadData();
  else await originalLoadData();
  notify(message,'ok');
 },
 choices:{},
 currentView:()=>view
};

// Botons principals i secundaris
const nav=get('dashboard').querySelector('.tabs');
nav.id='archive-nav';nav.replaceChildren();
mainNavigation.forEach(item=>{
 const b=document.createElement('button');b.type='button';b.dataset.group=item.group;
 b.textContent=item.title;b.onclick=()=>setView(item.view);nav.append(b);
});
const subnav=document.createElement('div');subnav.id='archive-subnav';subnav.className='subtabs';
nav.insertAdjacentElement('afterend',subnav);

// Filtres i exportació (sense tocar el cercador i els controls existents).
const filterBox=document.createElement('div');filterBox.id='workflow-filters';filterBox.className='workflow-filters';
const filters=[
 {id:'workflow-origin',label:'Origen',options:[
  ['','Tots els orígens'],['calendar','Calendari original'],['proposal','Propostes documentals'],['manual','Aportacions pròpies']]},
 {id:'workflow-status',label:'Estat',options:[
  ['Pendent','Pendents de decidir'],['','Tots els estats'],['En contrast','En contrast'],['Sense data','Aprovats sense data'],['Vincle pendent','Vincle pendent'],
  ['Possible duplicat','Possibles duplicats'],['Validat','Validats'],['Descartat','Descartats'],['Fusionat','Fusionats'],['Vinculat','Vinculats']]},
 {id:'workflow-priority',label:'Prioritat',options:[['','Totes'],['Alta','Alta'],['Mitjana','Mitjana'],['Baixa','Baixa']]}
];
filters.forEach(spec=>{
 const box=document.createElement('div');const l=document.createElement('label');l.textContent=spec.label;l.htmlFor=spec.id;
 const s=document.createElement('select');s.id=spec.id;
 spec.options.forEach(pair=>{const op=document.createElement('option');op.value=pair[0];op.textContent=pair[1];s.append(op)});
 s.onchange=()=>{page=0;loadData()};box.append(l,s);filterBox.append(box);
});
const actions=document.createElement('div');actions.className='workflow-actions';
const exportBtn=document.createElement('button');exportBtn.id='archive-export';exportBtn.textContent='Exporta el calendari · CSV';exportBtn.type='button';
const newBtn=document.createElement('button');newBtn.id='archive-new';newBtn.textContent='+ Afegeix una proposta';newBtn.type='button';
newBtn.onclick=()=>setView('archive_manual_proposals');
actions.append(exportBtn,newBtn);filterBox.append(actions);
const toolbar=get('search').closest('.card');toolbar.append(filterBox);

function groupFor(v){
 if(v===queue||v==='archive_proposals')return 'review';
 if(v==='archive_calendar_baseline')return 'calendar';
 if(v===valid)return 'validated';
 if(v==='archive_people')return 'people';
 if(['archive_sources','archive_chapters','archive_dossiers','archive_reference_catalogue'].includes(v))return 'library';
 if(['archive_doubts',history].includes(v))return 'tracking';
 if(v==='archive_manual_proposals')return 'new';
 return 'review';
}
function syncUI(){
 const group=groupFor(view);
 nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.group===group));
 subnav.replaceChildren();
 (subdivisions[group]||[]).forEach(item=>{
  const b=document.createElement('button');b.type='button';b.textContent=item.title;b.className=view===item.view?'active':'';
  b.onclick=()=>setView(item.view);subnav.append(b);
 });
 const isQ=view===queue;
 filterBox.querySelectorAll('#workflow-origin,#workflow-status,#workflow-priority').forEach(e=>e.parentElement.hidden=!isQ);
 exportBtn.hidden=view!==valid;
 newBtn.hidden=view==='archive_manual_proposals';
 get('month-filter').hidden=![queue,valid,'archive_calendar_baseline','archive_proposals','archive_reference_catalogue','archive_manual_proposals'].includes(view);
 get('search').placeholder=view===history?'Cerca un identificador de registre…':'Cerca un títol, una persona o una paraula…';
 get('search').setAttribute('aria-label','Cerca registres');
}
setView=function(next){
 originalSetView(next);
 syncUI();
};
loadData=async function(){
 syncUI();
 if(![queue,valid,history].includes(view))return originalLoadData();
 const seq=++loadSeq;
 selected=null;
 const v=views[view];
 get('view-description').textContent=v.description;
 get('list-label').textContent=v.title;
 get('results').textContent='Carregant registres…';
 get('detail').textContent='Selecciona un registre.';
 let q=db.from(view).select(v.fields,{count:'exact'});
 const term=slugSafe(get('search').value);
 if(term)q=q.ilike(view===history?'entity_id':'title','%'+term+'%');
 if(view!==history){
  const m=get('month-filter').value;if(m)q=q.eq('month',Number(m));
  if(view===queue){
   const origin=get('workflow-origin').value,status=get('workflow-status').value,priority=get('workflow-priority').value;
   if(origin)q=q.eq('origin',origin);
   if(status)q=q.eq('workflow_state',status);
   if(priority)q=q.eq('priority',priority);
  }
  q=q.order('month',{ascending:true,nullsFirst:false}).order('day',{ascending:true,nullsFirst:false}).order('title',{ascending:true});
 }else q=q.order('changed_at',{ascending:false});
 const result=await q.range(page*limit,(page+1)*limit-1);
 if(seq!==loadSeq)return;
 if(result.error){get('results').textContent='No s’ha pogut carregar la llista.';notify('Error de consulta: '+result.error.message,'error');return}
 rows=result.data||[];total=result.count||0;
 renderRows();
 get('page-info').textContent=total+' registres · pàgina '+(page+1);
 get('prev').disabled=page===0;
 get('next').disabled=(page+1)*limit>=total;
 if(rows.length&&view!==history){selected=0;renderRows();renderDetail(rows[0])}
 else get('detail').innerHTML='<div class="empty">Selecciona un registre per obrir-ne la fitxa.</div>';
};
renderRows=function(){
 if(![queue,valid,history].includes(view))return originalRenderRows();
 const list=get('results');list.replaceChildren();
 if(!rows.length){list.innerHTML='<div class="empty">No hi ha registres amb aquests filtres.</div>';return}
 rows.forEach((r,i)=>{
  const button=document.createElement('button');button.type='button';
  button.className='item'+(selected===i?' active':'');
  const headline=document.createElement('strong');headline.className='record-title';
  headline.textContent=view===history?(r.entity_id+' · '+r.entity_type):r.title;
  button.append(headline);
  const meta=document.createElement('small');
  meta.textContent=view===history
   ?(r.change_type+' · '+new Date(r.changed_at).toLocaleString('ca-ES'))
   :itemDate(r)+' · '+labelOrigin(r.origin);
  button.append(meta);
  if(view===queue){
   const chip=tag(r.workflow_state,r.workflow_state==='Descartat'?'danger':r.workflow_state==='Pendent'?'neutral':r.workflow_state==='En contrast'||r.workflow_state==='Sense data'?'warn':'');
   chip.style.marginTop='5px';button.append(chip);
   if(r.priority)button.append(tag('Prioritat '+r.priority,'neutral'));
  }
  button.onclick=()=>{selected=i;renderRows();renderDetail(r)};
  list.append(button);
 });
};
renderDetail=function(record){
 if(isUnified())return wf.showRecord(record);
 if(view==='archive_calendar_baseline'){
  if(record)return wf.showRecord({origin:'calendar',record_id:record.id,title:record.title,item_key:'calendar:'+record.id,day:record.day,month:record.month,historic_year:record.historic_year});
  return originalRenderDetail(record);
 }
 originalRenderDetail(record);
 if(record)wf.showExisting(record,view);
};

loadStats=async function(){
 if(!db)return;
 const specs=[
  {title:'Per revisar',table:queue,status:'Pendent'},
  {title:'Efemèrides validades',table:valid},
  {title:'Calendari original',table:'archive_calendar_baseline'},
  {title:'Propostes documentals',table:'archive_proposals'},
  {title:'Persones',table:'archive_people'},
  {title:'Dubtes pendents',table:'archive_doubts',status:'Pendent'}
 ];
 const stats=await Promise.all(specs.map(async s=>{
  try{let q=db.from(s.table).select('*',{count:'exact',head:true});if(s.status)q=q.eq(s.table===queue?'workflow_state':'status',s.status);
   const {count,error}=await q;return {name:s.title,count:error?'—':count};}
  catch(e){return{name:s.title,count:'—'}}
 }));
 const container=get('stats');container.replaceChildren();
 stats.forEach(s=>{
  const card=document.createElement('div');card.className='stat';
  const n=document.createElement('b');n.textContent=s.count;
  const label=document.createElement('span');label.textContent=s.name;
  card.append(n,label);container.append(card);
 });
};

async function exportValidated(){
 if(!db)return;
 exportBtn.disabled=true;notify('Preparant l’exportació del calendari validat…','ok');
 try{
  const all=[];const batch=500;
  for(let start=0;start<200000;start+=batch){
   const {data,error}=await db.from(valid)
    .select('item_key,origin,record_id,day,month,historic_year,title,kind,source_label,decision')
    .order('month',{ascending:true}).order('day',{ascending:true}).range(start,start+batch-1);
   if(error)throw error;
   all.push(...(data||[]));if(!data||data.length<batch)break;
  }
  if(!all.length){notify('El calendari validat encara és buit. Aprova primer alguna efemèride.','error');return}
  const cols=['item_key','origin','record_id','day','month','historic_year','title','kind','source_label','decision'];
  const quote=v=>{
   const s=String(v??'');const safe=/^[=+\-@]/.test(s)?"'"+s:s;
   return '"'+safe.replace(/"/g,'""')+'"';
  };
  const csv='\uFEFF'+[cols.join(';'),...all.map(row=>cols.map(k=>quote(row[k])).join(';'))].join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='arxiu-penya-calendari-validat.csv';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  notify('Exportats '+all.length+' registres validats.','ok');
 }catch(e){notify('No s’ha pogut exportar: '+(e?.message||'Error desconegut'),'error')}
 finally{exportBtn.disabled=false}
}
exportBtn.onclick=exportValidated;
view=queue;page=0;syncUI();
})();
