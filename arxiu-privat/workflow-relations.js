/* Arxiu Històric Penya — relacions, coincidències i connexió persones↔efemèrides. */
(function(){
'use strict';
const WF=window.ArchiveWorkflow;if(!WF)return;
const entityColumn={calendar:'calendar_id',proposal:'proposal_id',manual:'manual_id'};
const tableOf={calendar:'archive_calendar_baseline',proposal:'archive_proposals',manual:'archive_manual_proposals'};
function mk(tag,text,cls){
 const e=document.createElement(tag);
 if(text!==undefined)e.textContent=String(text);
 if(cls)e.className=cls;
 return e;
}
function empty(where,text){
 where.append(mk('p',text,'empty-state'));
}
function row(container,title,caption,callback,action='Obre'){
 const r=mk('div',undefined,'related-row');
 const box=mk('div');box.append(mk('div',title||'Sense títol'));
 if(caption)box.append(mk('div',caption,'mini-help'));
 r.append(box);
 if(callback){const b=mk('button',action);b.type='button';b.onclick=callback;r.append(b)}
 container.append(r);return r;
}
function open(origin,id,title){
 if(!origin||!id)return;
 WF.openRecord(origin,String(id),title);
}
function safeTerm(v){return String(v||'').trim().replace(/[%_,()]/g,'').slice(0,90)}
async function findPeopleLinks(origin,record,list,isCurrent){
 const col=entityColumn[origin];if(!col)return;
 const {data,error}=await db.from('archive_person_event_links').select('id,person_id,relation').eq(col,record.id).limit(30);
 if(error||!data?.length||!isCurrent())return;
 const ids=[...new Set(data.map(x=>x.person_id))];
 const response=await db.from('archive_people').select('id,name,category').in('id',ids);
 const names=new Map((response.data||[]).map(x=>[x.id,x]));
 list.append(mk('strong','Persones vinculades'));
 data.forEach(link=>{
  const p=names.get(link.person_id);
  const r=row(list,p?.name||link.person_id,(p?.category||'')+' · '+(link.relation||'Relacionat'),
   ()=>showPersonRecord(link.person_id,p?.name));
  if(WF.isEditor()){
   const btn=mk('button','Desvincula');btn.type='button';
   btn.onclick=async()=>{
    if(!window.confirm('Desvincular aquesta persona de l’efemèride? La fitxa original no es modificarà.'))return;
    const {error}=await db.from('archive_person_event_links').delete().eq('id',link.id);
    if(error)WF.showError(error.message);
    else {WF.showError('');await window.ArchiveRelations.render(list.parentElement,origin,record,()=>true)}
   };
   r.append(btn);
  }
 });
}
function showPersonRecord(id,name){
 // La fitxa de persones és consultable i revisable des del seu apartat.
 setView('archive_people');
 const input=document.getElementById('search');
 input.value=name||'';
 page=0;loadData();
}
async function renderEventRelations(container,origin,record,isCurrent){
 const list=mk('div');container.append(list);
 const tasks=[];
 if(origin==='calendar'){
  tasks.push(db.from('archive_proposals')
   .select('id,title,linked_calendar_id,decision')
   .eq('linked_calendar_id',record.id).limit(20)
   .then(({data})=>{
    if(!isCurrent()||!data?.length)return;
    list.append(mk('strong','Propostes vinculades'));
    data.forEach(p=>row(list,p.title,'Proposta '+p.id+' · '+p.decision,()=>open('proposal',p.id,p.title)));
   }));
  tasks.push(db.from('archive_proposal_matches')
   .select('proposal_id,score,confirmed_by_editor')
   .eq('calendar_id',record.id).limit(25)
   .then(async ({data})=>{
    if(!isCurrent()||!data?.length)return;
    const ids=data.map(m=>m.proposal_id);
    const r=await db.from('archive_proposals').select('id,title').in('id',ids);
    if(!isCurrent())return;
    const names=new Map((r.data||[]).map(p=>[p.id,p.title]));
    list.append(mk('strong','Coincidències suggerides (no confirmades automàticament)'));
    data.forEach(m=>{
     row(list,names.get(m.proposal_id)||m.proposal_id,
      'Candidat · puntuació '+(m.score??'—')+(m.confirmed_by_editor?' · coincidència confirmada':' · pendent de contrastar'),
      ()=>open('proposal',m.proposal_id,names.get(m.proposal_id)));
    });
   }));
  tasks.push(db.from('archive_manual_proposals')
    .select('id,title').eq('linked_calendar_id',record.id).limit(15)
    .then(({data})=>{
     if(!isCurrent()||!data?.length)return;
     list.append(mk('strong','Aportacions vinculades'));
     data.forEach(p=>row(list,p.title,'Aportació pròpia',()=>open('manual',p.id,p.title)));
    }));
 }else{
  if(record.linked_calendar_id){
   tasks.push(db.from('archive_calendar_baseline')
    .select('id,title,historic_year').eq('id',record.linked_calendar_id).maybeSingle()
    .then(({data})=>{
     if(!isCurrent()||!data)return;
     list.append(mk('strong','Registre existent relacionat'));
     row(list,data.title,data.id+' · '+(data.historic_year||''),()=>open('calendar',data.id,data.title));
    }));
  }
  if(origin==='proposal'){
   tasks.push(db.from('archive_proposal_matches')
    .select('calendar_id,score,confirmed_by_editor').eq('proposal_id',record.id).limit(25)
    .then(async ({data})=>{
     if(!data?.length||!isCurrent())return;
     const ids=data.map(m=>m.calendar_id);
     const r=await db.from('archive_calendar_baseline').select('id,title,historic_year').in('id',ids);
     if(!isCurrent())return;
     const names=new Map((r.data||[]).map(x=>[x.id,x]));
     list.append(mk('strong','Possibles coincidències'));
     data.forEach(m=>{
      const match=names.get(m.calendar_id);
      row(list,match?.title||m.calendar_id,
       'ID '+m.calendar_id+' · coincidència '+(m.score??'—')+(m.confirmed_by_editor?' · confirmada':' · no confirmada'),
       ()=>open('calendar',m.calendar_id,match?.title));
     });
    }));
  }
  if(record.day&&record.month){
   tasks.push(db.from('archive_calendar_baseline')
    .select('id,title,historic_year').eq('day',record.day).eq('month',record.month).limit(15)
    .then(({data})=>{
     if(!data?.length||!isCurrent())return;
     const sameYear=(data||[]).filter(x=>!record.historic_year||x.historic_year===record.historic_year);
     if(!sameYear.length)return;
     list.append(mk('strong','Mateixa data i any (candidats, no duplicats confirmats)'));
     sameYear.forEach(x=>row(list,x.title,x.id,()=>open('calendar',x.id,x.title)));
    }));
  }
  if(origin==='proposal'&&Array.isArray(record.chapters)&&record.chapters.length){
   tasks.push(db.from('archive_chapters')
    .select('id,title,ordinal').in('ordinal',record.chapters.slice(0,25))
    .then(({data})=>{
     if(!isCurrent()||!data?.length)return;
     list.append(mk('strong','Capítols citats'));
     data.forEach(ch=>row(list,'Capítol '+ch.ordinal+': '+ch.title,'Font documental',()=>showChapter(ch)));
    }));
  }
 }
 tasks.push(findPeopleLinks(origin,record,list,isCurrent));
 await Promise.allSettled(tasks);
 if(!isCurrent())return;
 if(!list.childNodes.length)empty(list,'No s’han identificat coincidències confirmades. Les fonts originals continuen disponibles.');
 if(WF.isEditor())renderPersonFinder(container,origin,record,isCurrent);
}
function showChapter(ch){
 setView('archive_chapters');const input=document.getElementById('search');input.value=ch.title;page=0;loadData();
}
async function renderPersonConnections(container,person,isCurrent){
 const list=mk('div');container.append(list);
 const response=await db.from('archive_person_event_links')
  .select('id,calendar_id,proposal_id,manual_id,relation').eq('person_id',person.id).limit(100);
 if(!isCurrent())return;
 if(response.error){empty(list,'No s’han pogut llegir les relacions: '+response.error.message);return}
 if(response.data?.length){
  list.append(mk('strong','Efemèrides vinculades explícitament'));
  for(const link of response.data){
   const origin=link.calendar_id?'calendar':link.proposal_id?'proposal':'manual';
   const id=link.calendar_id||link.proposal_id||link.manual_id;
   const r=await db.from(tableOf[origin]).select('id,title').eq('id',id).maybeSingle();
   if(!isCurrent())return;
   const card=row(list,r.data?.title||id,(link.relation||'Relacionat')+' · '+origin,()=>open(origin,id,r.data?.title));
   if(WF.isEditor()){
    const b=mk('button','Desvincula');b.type='button';
    b.onclick=async()=>{
     if(!window.confirm('Eliminar aquest enllaç editorial? No s’eliminarà cap efemèride.'))return;
     const {error}=await db.from('archive_person_event_links').delete().eq('id',link.id);
     if(error)WF.showError(error.message);
     else {
      container.replaceChildren();
      window.ArchiveRelations.render(container,'archive_people',person,()=>true);
     }
    };
    card.append(b);
   }
  }
 }
 const name=safeTerm(person.name);
 if(name.length>=4){
  const results=await Promise.all([
   db.from('archive_calendar_baseline').select('id,title').ilike('title','%'+name+'%').limit(8),
   db.from('archive_proposals').select('id,title').ilike('title','%'+name+'%').limit(8)
  ]);
  if(!isCurrent())return;
  const suggestions=[...(results[0].data||[]).map(x=>({...x,origin:'calendar'})),
   ...(results[1].data||[]).map(x=>({...x,origin:'proposal'}))];
  if(suggestions.length){
   list.append(mk('strong','Referències per coincidència de text (pendent de verificar)'));
   suggestions.forEach(x=>row(list,x.title,WF.labelOrigin(x.origin),()=>open(x.origin,x.id,x.title)));
  }
 }
 if(!list.childNodes.length)empty(list,'No hi ha relacions enregistrades.');
 if(WF.isEditor())renderEventFinder(container,person,isCurrent);
}
function renderPersonFinder(container,origin,record,isCurrent){
 const box=mk('div',undefined,'editor-card');
 const head=mk('h4','Vincula una persona existent');
 const hint=mk('p','Afegeix una relació editorial explícita; no modifica la fitxa original.','mini-help');
 const label=mk('label','Cerca pel nom');const input=mk('input');input.placeholder='Nom, cognom o fragment…';
 const results=mk('div');
 box.append(head,hint,label,input,results);container.append(box);
 let timer=0;
 input.oninput=()=>{clearTimeout(timer);timer=setTimeout(async()=>{
  const term=safeTerm(input.value);results.replaceChildren();if(term.length<2)return;
  const {data,error}=await db.from('archive_people').select('id,name,category')
   .ilike('name','%'+term+'%').order('name').limit(15);
  if(!isCurrent())return;
  if(error){empty(results,error.message);return}
  for(const p of data||[]){
   row(results,p.name,p.category,async()=>{
    const payload={person_id:p.id,created_by:me.id,relation:'Relacionat'};
    payload[entityColumn[origin]]=record.id;
    const {error}=await db.from('archive_person_event_links').insert(payload);
    if(error)WF.showError(error.code==='23505'?'La persona ja està vinculada a aquesta efemèride.':error.message);
    else{notify('Persona vinculada.','ok');container.replaceChildren();await window.ArchiveRelations.render(container,origin,record,()=>true)}
   },'Vincula');
  }
 },300)};
}
function renderEventFinder(container,person,isCurrent){
 const box=mk('div',undefined,'editor-card');
 box.append(mk('h4','Relaciona aquesta persona amb una efemèride'));
 box.append(mk('p','Cerca entre el Calendari original, les propostes i les aportacions.','mini-help'));
 const input=mk('input');input.placeholder='Cerca pel títol…';input.setAttribute('aria-label','Cerca una efemèride');
 const results=mk('div');box.append(input,results);container.append(box);
 let timer=0;
 input.oninput=()=>{clearTimeout(timer);timer=setTimeout(async()=>{
  const term=safeTerm(input.value);results.replaceChildren();if(term.length<2)return;
  const {data,error}=await db.from('archive_review_queue')
   .select('origin,record_id,title,day,month,historic_year')
   .ilike('title','%'+term+'%').limit(20);
  if(!isCurrent())return;
  if(error){empty(results,error.message);return}
  for(const item of data||[]){
   row(results,item.title,WF.labelOrigin(item.origin)+' · '+WF.itemDate(item),async()=>{
    const payload={person_id:person.id,created_by:me.id,relation:'Relacionat'};
    payload[entityColumn[item.origin]]=item.record_id;
    const {error}=await db.from('archive_person_event_links').insert(payload);
    if(error)WF.showError(error.code==='23505'?'Aquest enllaç ja existeix.':error.message);
    else{notify('Relació desada.','ok');container.replaceChildren();await window.ArchiveRelations.render(container,'archive_people',person,()=>true)}
   },'Vincula');
  }
 },300)};
}
async function renderDocuments(container,origin,record,isCurrent){
 const list=mk('div');container.append(list);
 if(origin==='archive_sources'){
  const {data}=await db.from('archive_chapters').select('id,title,ordinal,printed_page')
   .eq('source_id',record.id).order('ordinal',{ascending:true}).limit(101);
  if(!isCurrent())return;
  if(data?.length){
   list.append(mk('strong','Capítols d’aquesta font'));
   data.forEach(x=>row(list,'Capítol '+x.ordinal+': '+x.title,'Pàgina '+(x.printed_page||'—'),()=>showChapter(x)));
  }
 }
 if(origin==='archive_chapters'){
  const {data}=await db.from('archive_proposals')
   .select('id,title').contains('chapters',[record.ordinal]).limit(30);
  if(!isCurrent())return;
  if(data?.length){
   list.append(mk('strong','Propostes relacionades amb aquest capítol'));
   data.forEach(x=>row(list,x.title,'Proposta documental',()=>open('proposal',x.id,x.title)));
  }
 }
 if(origin==='archive_reference_catalogue'&&record.day&&record.month){
  const {data}=await db.from('archive_calendar_baseline').select('id,title,historic_year')
   .eq('day',record.day).eq('month',record.month).limit(15);
  if(!isCurrent())return;
  const matches=(data||[]).filter(x=>!record.historic_year||x.historic_year===record.historic_year);
  if(matches.length){
   list.append(mk('strong','Registres del Calendari de la mateixa data i any'));
   matches.forEach(x=>row(list,x.title,x.id,()=>open('calendar',x.id,x.title)));
  }
 }
 if(!list.childNodes.length)empty(list,'Sense vincles documentals identificats en aquesta fitxa.');
}
window.ArchiveRelations={
 render:async function(container,origin,record,isCurrent=()=>true){
  container.replaceChildren();
  if(['calendar','proposal','manual'].includes(origin))return renderEventRelations(container,origin,record,isCurrent);
  if(origin==='archive_people')return renderPersonConnections(container,record,isCurrent);
  return renderDocuments(container,origin,record,isCurrent);
 }
};
})();
