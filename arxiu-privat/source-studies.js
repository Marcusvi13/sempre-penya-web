/* Fase 2 — estudi documental i traçabilitat editorial de les fonts.
 * Unitat de treball: archive_sources.id; mai no modifica originals o decisions de calendari.
 */
(function(){
'use strict';
const WF=window.ArchiveWorkflow;
if(!WF)return;
const STATUSES=[
 ['pendent','Pendent de lectura'],
 ['lectura_parcial','Lectura parcial'],
 ['estudiat','Estudiat (document complet)'],
 ['contrastat','Contrastat amb altres fonts']
];
const ASSESSMENTS=[
 ['pista','Pista pendent'],
 ['contradiccio','Contradicció'],
 ['contrastat','Contrastat'],
 ['descartat','Pista descartada']
];
const LEVELS=['Molt alta','Alta','Mitjana','Complementària','Baixa','Duplicat'];
const LIMIT=20;
const st={host:null,ui:null,sources:[],studies:new Map(),findings:[],
 variants:new Map(),proposals:[],selected:null,page:0,seq:0,busy:false};
const el=(tag,cls,value)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(value!==undefined)e.textContent=String(value);return e;
};
const errorText=e=>e?.message||e?.error_description||String(e||'Error desconegut');
const statusOf=s=>st.studies.get(s.id)?.status||'pendent';
const statusName=s=>STATUSES.find(x=>x[0]===s)?.[1]||s;
const assName=s=>ASSESSMENTS.find(x=>x[0]===s)?.[1]||s;
const priority=s=>s.metadata?.inventory?.Valor||'Sense valoració';
const reading=s=>s.metadata?.inventory?.['Estat lectura']||'Sense classificació';
function options(select,values,current){
 values.forEach(([val,label])=>{
  const o=el('option','',label);o.value=val;select.append(o);
 });
 if(current!==undefined)select.value=current;
 return select;
}
function feedback(message,error=false){
 if(!st.ui)return;
 st.ui.message.hidden=!message;
 st.ui.message.textContent=message||'';
 st.ui.message.className=error?'material-feedback material-feedback-error':'material-feedback material-feedback-ok';
}
function mount(host){
 const shell=el('div','archive-study-shell');
 shell.innerHTML=
  '<h2>Estudi documental de les 136 fonts</h2>'+
  '<p class="muted">La lectura i el contrast es registren separadament de les efemèrides. Les troballes no aproven cap proposta automàticament. Les lectures fetes només a partir de text extret estan marcades com a parcials.</p>'+
  '<div class="archive-study-stats" id="archive-study-stats"></div>'+
  '<div class="archive-study-controls">'+
   '<label for="archive-study-status">Estat de lectura<select id="archive-study-status"></select></label>'+
   '<label for="archive-study-level">Valor històric<select id="archive-study-level"></select></label>'+
   '<label for="archive-study-search">Cerca de document<input id="archive-study-search" type="search" placeholder="Nom, títol, tema…"></label>'+
   '<button id="archive-study-refresh" type="button">Actualitza</button>'+
  '</div>'+
  '<p class="material-feedback" id="archive-study-feedback" hidden role="status"></p>'+
  '<div class="archive-study-columns">'+
    '<section class="archive-study-list-panel" aria-label="Llista de fonts">'+
     '<div class="archive-study-list" id="archive-study-list"></div>'+
     '<div class="archive-study-pages"><button id="archive-study-prev" type="button">Anterior</button>'+
      '<span id="archive-study-page"></span><button id="archive-study-next" type="button">Següent</button></div>'+
    '</section>'+
    '<section class="archive-study-detail" id="archive-study-detail" aria-label="Lectura i troballes de la font"></section>'+
  '</div>';
 host.replaceChildren(shell);
 const get=id=>shell.querySelector('#'+id);
 st.ui={
  stats:get('archive-study-stats'),status:get('archive-study-status'),
  level:get('archive-study-level'),search:get('archive-study-search'),
  list:get('archive-study-list'),detail:get('archive-study-detail'),
  refresh:get('archive-study-refresh'),message:get('archive-study-feedback'),
  prev:get('archive-study-prev'),next:get('archive-study-next'),
  pageLabel:get('archive-study-page')
 };
 options(st.ui.status,[['','Tots els estats'],...STATUSES],'');
 options(st.ui.level,[['','Totes les prioritats'],...LEVELS.map(x=>[x,x])],'');
 st.ui.status.onchange=()=>{st.page=0;renderList()};
 st.ui.level.onchange=()=>{st.page=0;renderList()};
 st.ui.search.oninput=()=>{st.page=0;renderList()};
 st.ui.refresh.onclick=()=>loadData(true);
 st.ui.prev.onclick=()=>{if(st.page>0){st.page--;renderList()}};
 st.ui.next.onclick=()=>{st.page++;renderList()};
}
function sourceLabel(s){return s.id+' · '+(s.title||s.original_filename||'Font');}
function filtered(){
 const term=st.ui.search.value.toLocaleLowerCase('ca').trim();
 return st.sources.filter(s=>
   (!st.ui.status.value||statusOf(s)===st.ui.status.value)&&
   (!st.ui.level.value||priority(s)===st.ui.level.value)&&
   (!term||[s.id,s.title,s.original_filename,s.metadata?.inventory?.['Àmbit']]
    .some(v=>String(v||'').toLocaleLowerCase('ca').includes(term)))
 ).sort((a,b)=>LEVELS.indexOf(priority(a)) - LEVELS.indexOf(priority(b))||
  a.id.localeCompare(b.id,'ca',{numeric:true}));
}
function renderStats(){
 const total=st.sources.length;
 const counts=new Map(STATUSES.map(([id])=>[id,st.sources.filter(s=>statusOf(s)===id).length]));
 st.ui.stats.replaceChildren();
 for(const [name,count] of [
  ['Fonts',total],['Pendents',counts.get('pendent')],['Lectura parcial',counts.get('lectura_parcial')],
  ['Estudiades',counts.get('estudiat')],['Contrastades',counts.get('contrastat')],
  ['Troballes',st.findings.length]
 ]){
  const card=el('div','archive-study-stat');
  card.append(el('strong','',count),el('small','',name));
  st.ui.stats.append(card);
 }
}
function renderList(){
 if(!st.ui)return;
 renderStats();
 const all=filtered(),pages=Math.max(1,Math.ceil(all.length/LIMIT));
 st.page=Math.max(0,Math.min(st.page,pages-1));
 const shown=all.slice(st.page*LIMIT,st.page*LIMIT+LIMIT);
 st.ui.list.replaceChildren();
 for(const src of shown){
  const b=el('button','archive-study-source'+(src.id===st.selected?' active':''));
  b.type='button';
  b.append(el('strong','',sourceLabel(src)));
  b.append(el('small','',statusName(statusOf(src))+' · '+priority(src)));
  b.onclick=()=>{st.selected=src.id;renderList();renderDetail(src.id)};
  st.ui.list.append(b);
 }
 if(!shown.length)st.ui.list.append(el('p','mini-help','Cap font amb aquests filtres.'));
 st.ui.pageLabel.textContent='Pàgina '+(st.page+1)+' de '+pages+' · '+all.length+' fonts';
 st.ui.prev.disabled=st.page===0;
 st.ui.next.disabled=st.page>=pages-1;
}
function linkedProposals(src){
 const name=String(src.original_filename||'').toLowerCase();
 return st.proposals.filter(p=>(p.source_label||'').split('|')
  .some(piece=>piece.trim().toLowerCase()===name));
}
function selectStatus(current){
 return options(el('select'),STATUSES,current);
}
function editFinding(item){
 const details=el('details','archive-study-edit-finding');
 details.append(el('summary','','Revisa o actualitza aquesta troballa'));
 const form=el('form','archive-study-form');
 const statement=el('textarea');statement.value=item.statement;statement.required=true;statement.maxLength=3000;
 const evidence=el('textarea');evidence.value=item.evidence_note||'';
 const page=el('input');page.value=item.page_reference||'';page.maxLength=200;
 const next=el('textarea');next.value=item.next_action||'';
 const assessment=options(el('select'),ASSESSMENTS,item.assessment);
 const prop=proposalSelect(item.proposal_id||'');
 const submit=el('button','primary','Desa els canvis');submit.type='submit';
 for(const [label,input] of [
  ['Troballa',statement],['Pàgina o referència',page],['Proposta relacionada',prop],
  ['Estat del contrast',assessment],['Observació de la font',evidence],
  ['Què queda per comprovar?',next]
 ])form.append(labeled(label,input));
 form.append(submit);details.append(form);
 form.onsubmit=async ev=>{
  ev.preventDefault();
  if(st.busy)return;
  if(statement.value.trim().length<8){feedback('La troballa necessita una descripció més concreta.',true);return}
  st.busy=true;submit.disabled=true;
  try{
   const payload={
    statement:statement.value.trim(),page_reference:page.value.trim(),
    proposal_id:prop.value||null,assessment:assessment.value,
    evidence_note:evidence.value.trim(),next_action:next.value.trim(),
    origin:'manual',updated_by:me.id
   };
   const {data,error}=await db.from('archive_source_findings').update(payload)
    .eq('id',item.id).eq('version',item.version).select('id');
   if(error)throw error;
   if(!data?.length)throw new Error('Aquesta troballa ja ha canviat. Actualitza les dades.');
   await loadData(false);
   feedback('Troballa actualitzada. Historial conservat.');
  }catch(e){feedback('Error en desar la troballa: '+errorText(e),true)}
  finally{st.busy=false;submit.disabled=false}
 };
 return details;
}
function labeled(label,control){
 const l=el('label','archive-study-field');
 l.append(el('span','',label),control);return l;
}
function proposalSelect(current){
 const s=el('select');
 s.append(Object.assign(el('option','','— Sense proposta relacionada —'),{value:''}));
 st.proposals.forEach(p=>s.append(Object.assign(el('option','',p.id+' · '+p.title),{value:p.id})));
 s.value=current;return s;
}
function renderFindings(src,host){
 host.replaceChildren();
 const list=st.findings.filter(f=>f.source_id===src.id);
 host.append(el('h4','','Troballes documentals ('+list.length+')'));
 if(!list.length)host.append(el('p','mini-help','Encara no hi ha troballes associades a aquest document.'));
 list.forEach(f=>{
  const item=el('article','archive-study-finding');
  const heading=el('div','archive-study-finding-header');
  heading.append(WF.tag(assName(f.assessment),f.assessment==='contradiccio'?'warn':'neutral'));
  if(f.origin==='lectura_assistida')heading.append(WF.tag('Lectura assistida · pendent de verificar','neutral'));
  item.append(heading,el('strong','',f.statement));
  if(f.page_reference)item.append(el('p','mini-help','Referència: '+f.page_reference));
  if(f.evidence_note)item.append(el('p','mini-help','Evidència i cautela: '+f.evidence_note));
  if(f.proposal_id){
   const p=st.proposals.find(x=>x.id===f.proposal_id);
   item.append(el('p','mini-help','Proposta: '+f.proposal_id+(p?' · '+p.title:'')));
  }
  if(f.next_action)item.append(el('p','mini-help','Pendent: '+f.next_action));
  if(WF.isEditor())item.append(editFinding(f));
  host.append(item);
 });
 if(WF.isEditor()){
  const add=el('details','archive-study-add');
  add.append(el('summary','','+ Afegeix una troballa a aquesta font'));
  const form=el('form','archive-study-form');
  const statement=el('textarea');statement.required=true;statement.maxLength=3000;
  statement.placeholder='Quin fet històric diu el document?';
  const page=el('input');page.placeholder='Pàgina o data de l’article';page.maxLength=200;
  const evidence=el('textarea');evidence.placeholder='Explica exactament què permet afirmar la font i les limitacions';
  const next=el('textarea');next.placeholder='Què s’ha de contrastar?';
  const assessment=options(el('select'),ASSESSMENTS,'pista');
  const prop=proposalSelect('');
  const submit=el('button','primary','Desa la troballa');submit.type='submit';
  for(const [label,input]of [
   ['Fet identificat',statement],['Pàgina',page],['Proposta existent (opcional)',prop],
   ['Estat de la troballa',assessment],['Evidències i cauteles',evidence],
   ['Comprovació pendent',next]
  ])form.append(labeled(label,input));
  form.append(submit);add.append(form);host.append(add);
  form.onsubmit=async ev=>{
   ev.preventDefault();if(st.busy)return;
   st.busy=true;submit.disabled=true;
   try{
    const {error}=await db.from('archive_source_findings').insert({
     source_id:src.id,proposal_id:prop.value||null,statement:statement.value.trim(),
     page_reference:page.value.trim(),evidence_note:evidence.value.trim(),
     assessment:assessment.value,next_action:next.value.trim(),
     origin:'manual',updated_by:me.id
    });
    if(error)throw error;
    await loadData(false);feedback('Troballa incorporada a la font.');
   }catch(e){feedback('No s’ha pogut desar: '+errorText(e),true)}
   finally{st.busy=false;submit.disabled=false}
  };
 }
}
async function renderDetail(id){
 if(!st.ui)return;
 const src=st.sources.find(s=>s.id===id);
 if(!src){st.ui.detail.replaceChildren(el('p','mini-help','Selecciona una font de l’esquerra.'));return}
 const token=++st.seq;
 const d=st.ui.detail;d.replaceChildren();
 d.append(el('h3','',sourceLabel(src)));
 d.append(el('p','mini-help',[
  src.kind||'',src.original_filename||'',priority(src),src.metadata?.inventory?.['Àmbit']||''
 ].filter(Boolean).join(' · ')));
 d.append(el('p','mini-help',
  'Estat a l’inventari inicial: '+reading(src)+
  '. Aquest camp històric no acredita una lectura completa.'));
 const original=src.storage_path||st.variants.get(src.id)?.storage_path;
 if(original){
  const isVariant=!src.storage_path;
  if(isVariant)d.append(el('p','source-missing',
   'Versió alternativa revisada: no és binàriament idèntica al document inventariat.'));
  const button=el('button','source-file-button',
   /\.pdf$/i.test(src.original_filename||'')?'Obre el PDF original / alternatiu':
    /\.(jpe?g|png|webp)$/i.test(src.original_filename||'')?'Obre la imatge':'Descarrega el document');
  const preview=el('div','document-preview');
  button.type='button';
  button.onclick=async()=>{
   button.disabled=true;
   try{
    await window.ArchiveResearch.openPrivateFile(original,
     src.original_filename||src.title,'',preview);
   }catch(e){feedback('No s’ha pogut obrir el fitxer privat: '+errorText(e),true)}
   finally{button.disabled=false}
  };
  d.append(button,preview);
 }else d.append(el('p','source-missing','No hi ha cap document vinculat.'));
 const progress=st.studies.get(src.id);
 const box=el('section','archive-study-progress');
 box.append(el('h4','','Seguiment de la lectura'));
 const status=selectStatus(progress?.status||'pendent');
 const notes=el('textarea');notes.value=progress?.notes||'';
 notes.placeholder='Abast de la lectura, errors d’OCR, dades pendents i fonts de contrast';
 box.append(labeled('Estat actual',status),labeled('Notes de lectura',notes));
 if(progress?.review_origin==='lectura_assistida')
  box.append(el('p','mini-help','Primera anotació procedent de lectura assistida de documents. Requereix supervisió editorial.'));
 if(WF.isEditor()){
  const submit=el('button','primary','Desa el seguiment');submit.type='button';
  box.append(submit);
  submit.onclick=async()=>{
   if(st.busy)return;st.busy=true;submit.disabled=true;
   try{
    const payload={source_id:src.id,status:status.value,notes:notes.value.trim(),
     updated_by:me.id,review_origin:'manual'};
    if(progress){
     const {data,error}=await db.from('archive_source_studies').update(payload)
      .eq('source_id',src.id).eq('version',progress.version).select('source_id');
     if(error)throw error;
     if(!data?.length)throw new Error('La lectura s’ha modificat en una altra sessió.');
    }else{
     const {error}=await db.from('archive_source_studies').insert(payload);
     if(error)throw error;
    }
    await loadData(false);feedback('Seguiment documental desat. Cap efemèride no s’ha aprovat automàticament.');
   }catch(e){feedback('No s’ha pogut desar: '+errorText(e),true)}
   finally{st.busy=false;submit.disabled=false}
  };
 }else{status.disabled=true;notes.disabled=true}
 d.append(box);
 const linked=linkedProposals(src);
 const links=el('section','archive-study-proposals');
 links.append(el('h4','','Propostes que citen aquesta font ('+linked.length+')'));
 if(!linked.length)links.append(el('p','mini-help','No hi ha propostes citant literalment aquest nom de fitxer.'));
 linked.forEach(p=>links.append(el('p','mini-help',p.id+' · '+p.title+' · '+(p.status||'Pendent'))));
 d.append(links);
 const findings=el('section','archive-study-findings');
 d.append(findings);
 if(token!==st.seq)return;
 renderFindings(src,findings);
}
async function loadData(showMessage=false){
 if(st.busy)return;
 const seq=++st.seq;
 if(showMessage)feedback('Actualitzant el seguiment documental…');
 const [sources,studies,findings,variants,proposals]=await Promise.all([
  db.from('archive_sources').select('id,title,kind,original_filename,storage_path,metadata')
   .order('id',{ascending:true}).limit(500),
  db.from('archive_source_studies').select('*').limit(500),
  db.from('archive_source_findings').select('*').order('source_id',{ascending:true}).limit(3000),
  db.from('archive_source_variants').select('source_id,storage_path').limit(500),
  db.from('archive_proposals').select('id,title,status,source_label').limit(500)
 ]);
 if(seq!==st.seq)return;
 const err=[sources,studies,findings,variants,proposals].find(r=>r.error)?.error;
 if(err){feedback('Error consultant les fonts: '+errorText(err),true);return}
 st.sources=sources.data||[];
 st.studies=new Map((studies.data||[]).map(v=>[v.source_id,v]));
 st.findings=findings.data||[];
 st.variants=new Map((variants.data||[]).map(v=>[v.source_id,v]));
 st.proposals=proposals.data||[];
 if(!st.sources.some(s=>s.id===st.selected))st.selected=st.sources[0]?.id||null;
 renderList();
 await renderDetail(st.selected);
 if(showMessage)feedback('Inventari i seguiment actualitzats.');
}
async function render(host){
 if(st.host!==host||!st.ui){st.host=host;mount(host)}
 await loadData(false);
}
window.ArchiveSourceStudy={render};
})();