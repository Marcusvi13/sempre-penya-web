/* Arxiu Històric Penya — fitxes, decisions, notes i historial.
   Les fitxes originals són de consulta. Només es guarden decisions separades. */
(function(){
'use strict';
const WF=window.ArchiveWorkflow;if(!WF)return;
const get=WF.get;
const tables={calendar:'archive_calendar_baseline',proposal:'archive_proposals',manual:'archive_manual_proposals',person:'archive_people',source:'archive_sources',chapter:'archive_chapters',dossier:'archive_dossiers',doubt:'archive_doubts',catalogue:'archive_reference_catalogue'};
const noteKinds={calendar:'calendar',proposal:'proposal',manual:'proposal',person:'person',source:'source',chapter:'chapter',dossier:'dossier',doubt:'doubt',catalogue:'catalogue',
 archive_people:'person',archive_chapters:'chapter',archive_sources:'source',
 archive_dossiers:'dossier',archive_doubts:'doubt',archive_reference_catalogue:'catalogue'};
let detailSequence=0;
const editable=()=>WF.isEditor();
function mk(tag,cls,text){
 const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;
}
function section(parent,title){
 const s=mk('section','detail-section');const h=mk('h4','',title);s.append(h);parent.append(s);return s;
}
function textRow(parent,label,value){
 if(value===undefined||value===null||value==='')return;
 const p=mk('p');const b=mk('strong','',label+': ');p.append(b);
 if(typeof value==='string'&&/^https:\/\//i.test(value)){
  const a=mk('a','','Obre la font');a.href=value;a.target='_blank';a.rel='noopener noreferrer';p.append(a);
 }else{
  let v=value;
  if(Array.isArray(value))v=value.join(', ');
  else if(typeof value==='object')v=JSON.stringify(value);
  const span=mk('span','',v);p.append(span);
 }
 parent.append(p);
}
function noticeBox(parent,message,kind){
 const n=mk('div',kind==='success'?'success-msg':'warn-msg',message);parent.append(n);return n;
}
function explainError(err){
 return err?.message||err?.error_description||String(err||'Error desconegut');
}
function current(sequence){return sequence===detailSequence}
function showMeta(d,record,ref,origin){
 const head=mk('h3','detail-heading',ref.title||record.title||record.name||record.id);d.append(head);
 const meta=mk('div','detail-meta',origin==='calendar'||origin==='proposal'||origin==='manual'?
  (WF.itemDate(record)+' · '+WF.labelOrigin(origin)):(record.category||record.thematic_type||'Fitxa documental'));
 d.append(meta);
 const chips=mk('div');chips.append(WF.tag('ID '+(record.id||ref.record_id),'neutral'));
 if(record.kind)chips.append(WF.tag(record.kind,'neutral'));
 if(ref.workflow_state)chips.append(WF.tag(ref.workflow_state,ref.workflow_state==='Descartat'?'danger':''));
 if(record.priority)chips.append(WF.tag('Prioritat '+record.priority,record.priority==='Alta'?'warn':'neutral'));
 d.append(chips);
 const originalInfo=mk('div','detail-original-info');
 const source=section(originalInfo,'Dades originals del registre');
 if(record.day&&record.month&&!['calendar','proposal','manual'].includes(origin))textRow(source,'Data anual',WF.itemDate(record));
 if(record.historic_year&&!['calendar','proposal','manual'].includes(origin))textRow(source,'Any històric',record.historic_year);
 if(record.status)textRow(source,'Classificació inicial',record.status);
 if(record.editorial_decision_original)textRow(source,'Decisió original importada',record.editorial_decision_original);
 if(record.original_decision)textRow(source,'Decisió original importada',record.original_decision);
 if(record.notes_original)textRow(source,'Notes originals',record.notes_original);
 if(record.evidence)textRow(source,'Evidències',record.evidence);
 if(record.certainty)textRow(source,'Certesa indicada',record.certainty);
 if(record.status_reason)textRow(source,'Motiu de la classificació',record.status_reason);
 if(record.source_id)textRow(source,'Identificador de la font',record.source_id);
 if(record.chapter_id)textRow(source,'Capítol relacionat',record.chapter_id);
 if(record.chapters?.length)textRow(source,'Capítols referenciats',record.chapters);
 if(record.people?.length)textRow(source,'Persones esmentades',record.people);
 if(record.linked_calendar_id)textRow(source,'Enllaç inicial al calendari',record.linked_calendar_id);
 if(record.notes&&origin==='manual')textRow(source,'Notes de l’aportació',record.notes);
 if(record.birth_label)textRow(source,'Naixement',record.birth_label);
 if(record.author)textRow(source,'Autor',record.author);
 if(record.document_date)textRow(source,'Data del document',record.document_date);
 if(record.thematic_type)textRow(source,'Classificació temàtica',record.thematic_type);
 if(record.printed_page)textRow(source,'Pàgina',record.printed_page);
 if(record.explanation)textRow(source,'Explicació',record.explanation);
 if(record.chapters_label)textRow(source,'Capítols documentals',record.chapters_label);
 if(record.synopsis)textRow(source,'Sinopsi',record.synopsis);
 if(record.years_referenced?.length)textRow(source,'Anys esmentats',record.years_referenced);
 if(record.people_referenced?.length)textRow(source,'Persones esmentades',record.people_referenced);
 return originalInfo;
}
WF.showRecord=async function(ref){
 const seq=++detailSequence;const d=get('detail');d.replaceChildren();
 if(!ref){d.append(mk('p','empty-state','Selecciona un registre.'));return}
 d.append(mk('p','empty-state','Carregant fitxa completa, fonts i revisió…'));
 const origin=ref.origin,table=tables[origin];
 if(!table){d.textContent='Tipus de fitxa desconegut.';return}
 try{
  const {data,error}=await db.from(table).select('*').eq('id',ref.record_id).maybeSingle();
  if(!current(seq))return;
  if(error)throw error;if(!data){d.textContent='No hem trobat el registre original.';return}
  d.replaceChildren();
  const originalInfo=showMeta(d,data,ref,origin);
  // El requadre verd comença amb la decisió editorial. Les fonts van immediatament després.
  const reviewHub=mk('div','editorial-review-hub');
  d.append(reviewHub);
  const isEvent=['calendar','proposal','manual'].includes(origin);
  let reviewTask=Promise.resolve();
  if(isEvent){
   const reviewBlock=section(reviewHub,'Decisió editorial');
   if(editable())reviewTask=renderEventEditor(reviewBlock,data,origin,seq);
   else reviewBlock.append(mk('p','empty-state','Compte de consulta: no pots modificar decisions.'));
  }else if(origin==='person'){
   const reviewBlock=section(reviewHub,'Selecció de persones');
   if(editable())reviewTask=renderPersonEditor(reviewBlock,data,seq);
  }else if(origin==='doubt'&&editable()){
   const reviewBlock=section(reviewHub,'Seguiment del dubte');
   editorDoubt(reviewBlock,data);
  }
  // Reserva la posició de les fonts immediatament sota la decisió.
  // Així, encara que la càrrega documental trigui, mai no saltaran per sota de les dades originals.
  const sourcesSlot=mk('div','detail-sources-slot');
  reviewHub.append(sourcesSlot);
  const materialsTask=(window.ArchiveSourcesHub?.render(sourcesSlot,origin,data,()=>current(seq))
   ||window.ArchiveResearch?.render(sourcesSlot,origin,String(data.id),()=>current(seq))
   ||Promise.resolve());
  d.append(originalInfo);
  await reviewTask;
  if(!current(seq))return;
  const auditTable=origin==='calendar'?'archive_calendar_reviews':origin==='person'?'archive_people_reviews':table;
  const relatedKind=({person:'archive_people',source:'archive_sources',chapter:'archive_chapters',
   dossier:'archive_dossiers',doubt:'archive_doubts',catalogue:'archive_reference_catalogue'})[origin]||origin;
  await Promise.all([
   materialsTask,
   appendNotes(d,noteKinds[origin],String(data.id),seq),
   ['calendar','proposal','manual','person','doubt'].includes(origin)?
     appendHistory(d,auditTable,String(data.id),seq):Promise.resolve(),
   appendRelations(d,relatedKind,data,seq)
  ]);
 }catch(e){if(current(seq)){d.replaceChildren();noticeBox(d,'No s’ha pogut obrir la fitxa: '+explainError(e));}}
};
WF.showExisting=function(record,activeView){
 const seq=++detailSequence;const d=get('detail');
 if(activeView==='archive_people'){
  d.replaceChildren();
  const originalInfo=showMeta(d,record,{record_id:record.id},'person');
  d.append(originalInfo);
  const p=section(d,'Selecció de persones');
  if(editable())renderPersonEditor(p,record,seq);
  else p.append(mk('p','empty-state','Aquest registre és de consulta.'));
 }
 Promise.all([
  (window.ArchiveSourcesHub?.render(d,({
   archive_people:'person',archive_chapters:'chapter',archive_sources:'source',
   archive_dossiers:'dossier',archive_doubts:'doubt',archive_reference_catalogue:'catalogue',
   archive_manual_proposals:'manual'})[activeView]||activeView,record,()=>current(seq))
   ||window.ArchiveResearch?.render(d,activeView,String(record.id),()=>current(seq))
   ||Promise.resolve()),
  appendNotes(d,noteKinds[activeView]||'source',String(record.id),seq),
  appendRelations(d,activeView,record,seq),
  activeView==='archive_people'?appendHistory(d,'archive_people_reviews',String(record.id),seq):Promise.resolve()
 ]).catch(e=>{if(current(seq))WF.showError('Error carregant fonts relacionades: '+explainError(e))});
};
async function renderEventEditor(container,record,origin,seq){
 let original=null;
 if(origin==='calendar'){
  const {data,error}=await db.from('archive_calendar_reviews').select('*').eq('calendar_id',record.id).maybeSingle();
  if(error)throw error;if(!current(seq))return;original=data;
 }
 const calendar=origin==='calendar';
 const options=calendar?
  ['','Conservar','Corregir','Descartar','Fusionar','Contrastar']:
  ['','Acceptar incorporació','Ampliar registre existent','Corregir registre existent','Descartar proposta','Demanar contrast'];
 const decision=calendar?(original?.proposed_decision||''):(record.decision==='Sense decidir'?'':record.decision);
 const card=mk('form','editor-card');
 // Tot el HTML següent és estàtic; cap dada externa no passa per innerHTML.
 card.innerHTML=
  '<h4>Revisió editorial</h4>'+
  '<label for="editor-decision">Decisió</label><select id="editor-decision" required></select>'+
  '<label for="editor-reason">Justificació i notes editorials (opcional)</label><textarea id="editor-reason" placeholder="Pots deixar-lo en blanc per decidir més de pressa."></textarea>'+
  '<div id="editor-correction" hidden><p class="mini-help">Només omple els camps que vols corregir. L’original continuarà intacte.</p>'+
  '<label for="corrected-title">Títol corregit</label><input id="corrected-title">'+
  '<label for="corrected-kind">Tipus corregit</label><input id="corrected-kind">'+
  '<div class="field-grid"><div><label for="corrected-day">Dia</label><input id="corrected-day" type="number" min="1" max="31"></div>'+
  '<div><label for="corrected-month">Mes</label><input id="corrected-month" type="number" min="1" max="12"></div></div>'+
  '<label for="corrected-year">Any corregit</label><input id="corrected-year"></div>'+
  '<div id="editor-link" hidden><label for="editor-linked-id">ID del registre del Calendari amb què es relaciona</label>'+
  '<input id="editor-linked-id" list="editor-suggestions" placeholder="Ex.: VN-E-0001">'+
  '<datalist id="editor-suggestions"></datalist>'+
  '<label for="editor-link-search">Cerca un registre pel títol</label>'+
  '<input id="editor-link-search" placeholder="Escriu una paraula per trobar coincidències…">'+
  '<p class="mini-help">Selecciona un identificador suggerit. Una coincidència no es considera confirmada fins que desis la revisió.</p></div>'+
  '<div class="editor-actions"><button type="submit" class="primary">Desa i continua</button></div>';
 container.append(card);
 const sel=card.querySelector('#editor-decision');
 options.forEach((name,index)=>{
  const op=document.createElement('option');op.value=name;op.textContent=name||'— Tria una decisió —';if(!index)op.disabled=true;sel.append(op);
 });
 sel.value=decision||'';
 card.querySelector('#editor-reason').value=calendar?(original?.rationale||''):(record.notes||'');
 card.querySelector('#corrected-title').value=original?.corrected_title||'';
 card.querySelector('#corrected-kind').value=original?.corrected_kind||'';
 card.querySelector('#corrected-year').value=original?.corrected_year||'';
 card.querySelector('#corrected-day').value=original?.corrected_day??'';
 card.querySelector('#corrected-month').value=original?.corrected_month??'';
 card.querySelector('#editor-linked-id').value=calendar?(original?.merged_into_calendar_id||''):(record.linked_calendar_id||'');
 function toggle(){
  const value=sel.value;
  card.querySelector('#editor-correction').hidden=!(calendar&&value==='Corregir');
  card.querySelector('#editor-link').hidden=!(value==='Fusionar'||value==='Ampliar registre existent'||value==='Corregir registre existent'||(!calendar&&Boolean(record.linked_calendar_id)));
 }
 sel.onchange=toggle;toggle();
 if(!calendar&&record.status==='Duplicat'){
  noticeBox(container,'Aquest candidat estava classificat com a possible duplicat. Compara les coincidències abans de decidir.');
 }
 if(!calendar&&(!record.day||!record.month)){
  noticeBox(container,'La proposta no té dia i mes acreditats. Encara que l’acceptis, no entrarà al Calendari validat fins que se’n documenti la data.');
 }
 await fillCalendarSuggestions(card,record,'',seq);
 let debounce;
 card.querySelector('#editor-link-search').oninput=()=>{
  clearTimeout(debounce);debounce=setTimeout(()=>{
   fillCalendarSuggestions(card,record,card.querySelector('#editor-link-search').value,seq);
  },300);
 };
 card.onsubmit=async event=>{
  event.preventDefault();
  if(!editable())return;
  const choice=sel.value,rationale=card.querySelector('#editor-reason').value.trim();
  const idLink=card.querySelector('#editor-linked-id').value.trim()||null;
  if(!choice){WF.showError('Tria una decisió editorial.');return}
  if(choice==='Fusionar'&&(!idLink||idLink===record.id)){
   WF.showError('Per fusionar, indica un altre registre existent del Calendari.');return;
  }
  if(['Ampliar registre existent','Corregir registre existent'].includes(choice)&&!idLink){
   WF.showError('Per ampliar o corregir un registre existent cal indicar amb quin es vincula.');return;
  }
  if(!calendar&&choice==='Acceptar incorporació'&&record.status==='Duplicat'){
   WF.showError('Aquesta proposta figura com a duplicada. Contrasta-la o vincula-la a l’efemèride existent abans d’aprovar-la.');return;
  }
  const submit=card.querySelector('button[type=submit]');submit.disabled=true;
  try{
   if(calendar){
    const revised={
     corrected_title:card.querySelector('#corrected-title').value.trim()||null,
     corrected_kind:card.querySelector('#corrected-kind').value.trim()||null,
     corrected_year:card.querySelector('#corrected-year').value.trim()||null,
     corrected_day:card.querySelector('#corrected-day').value?Number(card.querySelector('#corrected-day').value):null,
     corrected_month:card.querySelector('#corrected-month').value?Number(card.querySelector('#corrected-month').value):null
    };
    if(Boolean(revised.corrected_day)!==Boolean(revised.corrected_month))
     throw new Error('Si corregeixes la data, has d’indicar dia i mes.');
    if(choice==='Corregir'&&!Object.values(revised).some(v=>v!==null))
     throw new Error('Per corregir, introdueix almenys una dada modificada.');
    const payload={proposed_decision:choice,rationale,
     merged_into_calendar_id:choice==='Fusionar'?idLink:null,
     ...revised};
    if(original){
     const {data,error}=await db.from('archive_calendar_reviews').update(payload)
      .eq('calendar_id',record.id).eq('version',original.version).select('calendar_id');
     if(error)throw error;
     if(!data?.length)throw new Error('La fitxa ha canviat des que l’has obert. Actualitza-la abans de desar.');
    }else{
     const {error}=await db.from('archive_calendar_reviews').insert({...payload,calendar_id:record.id,updated_by:me.id});
     if(error)throw error;
    }
   }else if(origin==='proposal'){
    const {data,error}=await db.from('archive_proposals').update({
      decision:choice,notes:rationale,reviewed:true,linked_calendar_id:idLink
     }).eq('id',record.id).eq('version',record.version).select('id');
    if(error)throw error;if(!data?.length)throw new Error('Una altra sessió ha canviat la proposta. Torna-la a obrir.');
   }else{
    const {data,error}=await db.from('archive_manual_proposals').update({
      decision:choice,notes:rationale,reviewed:true,linked_calendar_id:idLink,
      updated_at:new Date().toISOString()
     }).eq('id',record.id).eq('updated_at',record.updated_at).select('id');
    if(error)throw error;if(!data?.length)throw new Error('La proposta s’ha modificat. Torna-la a obrir.');
   }
   await WF.afterSaved('Revisió editorial desada. L’original no s’ha modificat.');
  }catch(e){WF.showError('No s’ha pogut desar la revisió: '+explainError(e));submit.disabled=false;}
 };
}
async function fillCalendarSuggestions(card,record,search,seq){
 if(!current(seq))return;
 const options=card.querySelector('#editor-suggestions');if(!options)return;
 let q=db.from('archive_calendar_baseline').select('id,title,day,month,historic_year');
 const term=String(search||'').replace(/[%_,()]/g,'').trim();
 if(term.length>=2)q=q.ilike('title','%'+term+'%');
 else if(record.day&&record.month)q=q.eq('day',record.day).eq('month',record.month);
 else return;
 const {data,error}=await q.order('title',{ascending:true}).limit(30);
 if(error||!current(seq))return;
 options.replaceChildren();
 (data||[]).filter(r=>r.id!==record.id).forEach(r=>{
  const option=document.createElement('option');option.value=r.id;
  option.label=r.title.slice(0,115)+' · '+(r.historic_year||'');options.append(option);
 });
}
async function renderPersonEditor(container,person,seq){
 const {data:initialReview,error}=await db.from('archive_people_reviews').select('*').eq('person_id',person.id).maybeSingle();
 if(error){if(current(seq))noticeBox(container,'No es pot consultar la revisió: '+error.message);return}
 if(!current(seq))return;
 let existing=initialReview;
 const f=mk('form','editor-card');
 f.innerHTML='<h4>Selecció de persones</h4><label for="person-decision">Decisió</label>'+
  '<select id="person-decision" required><option value="">— Tria una decisió —</option>'+
  '<option>Incloure</option><option>Excloure</option><option>Contrastar</option></select>'+
  '<label for="person-notes">Criteri i fonts (opcional)</label><textarea id="person-notes" placeholder="Pots afegir una explicació quan vulguis."></textarea>'+
  '<div class="editor-actions"><button type="submit" class="primary">Desa la revisió de la persona</button></div>';
 container.append(f);
 f.querySelector('#person-decision').value=existing?.decision||'';
 f.querySelector('#person-notes').value=existing?.notes||'';
 f.onsubmit=async e=>{
  e.preventDefault();
  const dec=f.querySelector('#person-decision').value;
  const notes=f.querySelector('#person-notes').value.trim();
  if(!dec)return;
  const button=f.querySelector('button');button.disabled=true;
  try{
   if(existing){
    const {data,error}=await db.from('archive_people_reviews').update({decision:dec,notes})
     .eq('person_id',person.id).eq('version',existing.version).select('person_id');
    if(error)throw error;
    if(!data?.length)throw new Error('La fitxa ha canviat. Torna-la a obrir.');
   }else{
    const {error}=await db.from('archive_people_reviews').insert({person_id:person.id,decision:dec,notes});
    if(error)throw error;
   }
   notify('Decisió sobre la persona desada.','ok');
   const result=await db.from('archive_people_reviews').select('*').eq('person_id',person.id).maybeSingle();
   if(!result.error&&result.data)existing=result.data;
   button.disabled=false;
  }catch(err){WF.showError('Error en desar: '+explainError(err));button.disabled=false}
 };
}
async function appendNotes(d,kind,id,seq){
 if(!kind||!current(seq))return;
 const s=section(d,'Notes de recerca');
 const list=mk('div');s.append(list);
 async function reload(){
  const {data,error}=await db.from('archive_notes').select('id,note,created_at,author_id')
   .eq('target_kind',kind).eq('target_id',id).order('created_at',{ascending:false}).limit(15);
  if(!current(seq))return;
  list.replaceChildren();
  if(error){list.append(mk('p','empty-state','No es poden carregar les notes: '+error.message));return}
  if(!data?.length){list.append(mk('p','empty-state','Encara no hi ha notes addicionals.'));return}
  data.forEach(n=>{
   const row=mk('div','history-row');
   row.append(mk('div','note',n.note));
   row.append(mk('div','tiny',new Date(n.created_at).toLocaleString('ca-ES')));
   list.append(row);
  });
 }
 await reload();if(!current(seq))return;
 if(!editable())return;
 const f=mk('form','editor-card');
 f.innerHTML='<label for="new-research-note">Afegeix una nota de recerca</label>'+
  '<textarea id="new-research-note" required placeholder="Font, hipòtesi o informació per verificar…"></textarea>'+
  '<button type="submit">Afegeix la nota</button>';
 s.append(f);
 f.onsubmit=async e=>{
  e.preventDefault();const note=f.querySelector('textarea').value.trim();
  if(!note)return;
  const button=f.querySelector('button');button.disabled=true;
  try{
   const {error}=await db.from('archive_notes').insert({target_kind:kind,target_id:id,note,author_id:me.id});
   if(error)throw error;
   f.reset();await reload();notify('Nota desada i incorporada a l’historial.','ok');
  }catch(err){WF.showError('No s’ha pogut afegir la nota: '+explainError(err))}
  finally{button.disabled=false}
 };
}
async function appendHistory(d,entityType,id,seq){
 if(!current(seq))return;
 const s=section(d,'Historial de decisions');
 const list=mk('div');s.append(list);
 const {data,error}=await db.from('archive_change_log')
  .select('id,change_type,changed_at,old_value,new_value')
  .eq('entity_type',entityType).eq('entity_id',id)
  .order('changed_at',{ascending:false}).limit(8);
 if(!current(seq))return;
 if(error){list.append(mk('p','empty-state','Historial no disponible: '+error.message));return}
 if(!data?.length){list.append(mk('p','empty-state','Encara no s’ha desat cap decisió nova.'));return}
 const keys=['proposed_decision','decision','rationale','notes','corrected_title','corrected_day','corrected_month',
 'corrected_year','merged_into_calendar_id','linked_calendar_id','reviewed'];
 data.forEach(change=>{
  const box=mk('div','history-row');
  const title=mk('strong','',change.change_type.toUpperCase()+' · '+new Date(change.changed_at).toLocaleString('ca-ES'));
  box.append(title);
  const before=change.old_value||{},after=change.new_value||{};
  const diff=keys.filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]))
   .map(k=>k+': '+String(before[k]??'—')+' → '+String(after[k]??'—')).slice(0,4);
  box.append(mk('div','mini-help',diff.length?diff.join(' · ').slice(0,500):'Modificació registrada'));
  list.append(box);
 });
}
async function appendRelations(d,origin,record,seq){
 if(!current(seq))return;
 const s=section(d,'Coincidències, persones i documents relacionats');
 const target=mk('div');s.append(target);
 if(window.ArchiveRelations?.render){
  try{await window.ArchiveRelations.render(target,origin,record,()=>current(seq))}
  catch(e){if(current(seq))target.append(mk('p','empty-state','No s’han pogut consultar les relacions: '+explainError(e)))}
 }else target.append(mk('p','empty-state','Les relacions documentals no estan disponibles.'));
}
})();
