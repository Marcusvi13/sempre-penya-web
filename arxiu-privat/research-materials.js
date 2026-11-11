/* Arxiu Històric Penya — materials de recerca adjunts, independents de la revisió editorial.
   Enllaços HTTPS, referències i fitxers privats; mai no canvia cap efemèride original. */
(function(){
'use strict';
const WF=window.ArchiveWorkflow;
if(!WF)return;
const BUCKET='arxiu-historic-privat';
const TABLE='archive_research_materials';
const MAX_FILE_SIZE=20*1024*1024;
const kindMap={
 'calendar':'calendar','proposal':'proposal','manual':'manual','person':'person',
 'source':'source','chapter':'chapter','dossier':'dossier','doubt':'doubt','catalogue':'catalogue',
 'archive_calendar_baseline':'calendar','archive_proposals':'proposal',
 'archive_manual_proposals':'manual','archive_people':'person',
 'archive_sources':'source','archive_chapters':'chapter','archive_dossiers':'dossier',
 'archive_doubts':'doubt','archive_reference_catalogue':'catalogue'
};
const types={'link':'Enllaç web','file':'Fitxer privat','reference':'Referència documental'};
const allowedExt=new Set(['pdf','jpg','jpeg','png','webp','doc','docx','txt']);
function create(tag,cls,text){
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text!==undefined)e.textContent=String(text);
 return e;
}
function errorMessage(err){return err?.message||err?.error_description||String(err||'Error desconegut')}
function formatDate(value){
 try{return new Date(value).toLocaleString('ca-ES')}catch{return String(value||'')}
}
function showMessage(host,message,fail=false){
 host.textContent=message;
 host.className='material-feedback '+(fail?'material-feedback-error':'material-feedback-ok');
 host.hidden=false;
}
function makeTextRow(parent,value,label){
 if(!value)return;
 const p=create('p','material-description');
 if(label){const strong=create('strong','',label+': ');p.append(strong)}
 p.append(document.createTextNode(String(value)));
 parent.append(p);
}
async function openPrivateFile(path,fileName,mime='',preview=null){
 if(!path)throw new Error('Aquest document no està pujat al repositori privat');
 const isPdf=/\.pdf$/i.test(fileName||'')||mime==='application/pdf';
 const store=db.storage.from(BUCKET);
 if(isPdf&&preview){
  const {data,error}=await store.createSignedUrl(path,300);
  if(error||!data?.signedUrl)throw error||new Error('No s’ha pogut obtenir l’accés temporal');
  if(preview.childNodes.length){preview.replaceChildren();return}
  const frame=create('iframe','document-pdf-frame');
  frame.title='Previsualització del PDF: '+fileName;
  frame.src=data.signedUrl;
  frame.setAttribute('loading','lazy');
  frame.setAttribute('referrerpolicy','no-referrer');
  const close=create('button','document-close','Tanca la previsualització');
  close.type='button';close.onclick=()=>preview.replaceChildren();
  const open=create('a','material-link','Obre el PDF en una pestanya');
  open.href=data.signedUrl;open.target='_blank';open.rel='noopener noreferrer';
  preview.append(close,open,frame);
  return;
 }
 // Word i altres fitxers: descàrrega autentificada, sense servei extern ni URL pública.
 const {data,error}=await store.download(path);
 if(error||!data)throw error||new Error('El fitxer no està disponible');
 const url=URL.createObjectURL(data);
 const a=create('a');
 a.href=url;a.download=fileName||'document';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function renderMaterials(container,kind,recordId,isCurrent=()=>true,options={}){
 const target=kindMap[kind];
 if(!target||!recordId||!isCurrent())return;
 const section=create(options.embedded?'div':'section',options.embedded?'material-subsection':'detail-section material-section');
 const title=create('h4','',options.embedded?'Materials afegits a la fitxa':'Materials i fonts de recerca');
 const explanation=create('p','mini-help',
  'Afegeix articles, documents i referències sense decidir si aquesta persona o efemèride ha de sortir al calendari. La fitxa original no canvia.');
 section.append(title,explanation);
 const controls=create('div','material-controls');
 const archivedToggle=create('label','material-archived-toggle');
 const checkbox=create('input');checkbox.type='checkbox';checkbox.checked=true;
 archivedToggle.append(checkbox,document.createTextNode('Inclou també els materials ocultats'));
 controls.append(archivedToggle);
 const refresh=create('button','','Actualitza els materials');refresh.type='button';controls.append(refresh);
 section.append(controls);
 const list=create('div','material-list');
 section.append(list);
 const formHost=create('div','material-editor');
 section.append(formHost);
 container.append(section);
 let generation=0;

 async function fetchList(){
  const seq=++generation;
  list.replaceChildren(create('p','empty-state','Carregant materials de recerca…'));
  let q=db.from(TABLE)
    .select('id,material_type,title,url,file_path,file_name,file_size,description,source_author,created_at,archived_at')
    .eq('target_kind',target).eq('target_id',String(recordId));
  if(!checkbox.checked)q=q.is('archived_at',null);
  const {data,error}=await q.order('created_at',{ascending:false}).limit(100);
  if(!isCurrent()||seq!==generation)return;
  list.replaceChildren();
  if(error){
   list.append(create('p','empty-state','No s’han pogut carregar els materials: '+errorMessage(error)));
   return;
  }
  if(!data?.length){
   list.append(create('p','empty-state','Encara no hi ha materials vinculats a aquesta fitxa.'));
   return;
  }
  for(const item of data){
   const row=create('div','material-item'+(item.archived_at?' material-archived':''));
   const head=create('div','material-heading');
   head.append(WF.tag(types[item.material_type]||'Material',item.archived_at?'neutral':''));
   const name=create('strong','material-name',item.title);
   head.append(name);
   row.append(head);
   if(item.url){
    // url està validada per HTTPS a la base de dades; no s'utilitza innerHTML.
    const a=create('a','material-link','Obre l’article o la font');
    a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';
    row.append(a);
   }else if(item.file_path){
    const isPdf=/\.pdf$/i.test(item.file_name||'')||item.mime_type==='application/pdf';
    const b=create('button','material-open',isPdf?'Visualitza el PDF':'Descarrega el document privat');
    b.type='button';
    const preview=create('div','document-preview');
    b.onclick=async()=>{
      b.disabled=true;
      try{await openPrivateFile(item.file_path,item.file_name||item.title,item.mime_type||'',preview)}
      catch(err){WF.showError('No s’ha pogut obrir el document privat: '+errorMessage(err))}
      finally{b.disabled=false}
    };
    row.append(b,preview);
    makeTextRow(row,(item.file_name||'Document')+(item.file_size?' · '+(item.file_size/1024/1024).toFixed(1)+' MB':''),'Fitxer');
   }
   makeTextRow(row,item.source_author,'Autor o procedència');
   makeTextRow(row,item.description,'Resum o observacions');
   const foot=create('div','material-footer');
   foot.append(create('small','',formatDate(item.created_at)));
   if(item.archived_at)foot.append(WF.tag('Ocultat anteriorment (conservat)','neutral'));
   if(WF.isEditor()){
    const action=create('button','material-archive',item.archived_at?'Torna a mostrar':'Oculta');
    action.type='button';
    action.onclick=async()=>{
     if(!window.confirm(item.archived_at
       ?'Vols tornar a mostrar aquest material a la fitxa?'
       :'Vols ocultar aquest material de les llistes habituals? El document no s’esborrarà.'))return;
     action.disabled=true;
     const {error}=await db.from(TABLE).update({
       archived_at:item.archived_at?null:new Date().toISOString(),
       archived_by:item.archived_at?null:me.id
     }).eq('id',item.id).select('id');
     action.disabled=false;
     if(error){WF.showError('Error en arxivar/restaurar: '+errorMessage(error));return}
     await fetchList();
    };
    foot.append(action);
   }
   row.append(foot);
   list.append(row);
  }
 }
 checkbox.onchange=fetchList;refresh.onclick=fetchList;

 if(WF.isEditor()){
  const form=create('form','editor-card material-form');
  form.innerHTML=
   '<h4>Afegeix un material a aquesta fitxa</h4>'+
   '<label for="research-type">Tipus de material</label>'+
   '<select id="research-type"><option value="link">Article o enllaç web</option>'+
   '<option value="file">Document o imatge (fitxer privat)</option>'+
   '<option value="reference">Referència bibliogràfica o documental</option></select>'+
   '<label for="research-title">Títol o descripció breu *</label>'+
   '<input id="research-title" type="text" maxlength="300" minlength="3" required placeholder="Ex.: Vida i trajectòria de Greg Woodard">'+
   '<div id="research-link-fields"><label for="research-url">Enllaç HTTPS *</label>'+
   '<input id="research-url" type="url" placeholder="https://..." autocomplete="url"></div>'+
   '<div id="research-file-fields" hidden><label for="research-file">Selecciona un fitxer *</label>'+
   '<input id="research-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt">'+
   '<p class="mini-help">PDF, imatges, Word o text · màxim 20 MB. El fitxer es desa en un espai privat.</p></div>'+
   '<label for="research-author">Autor, publicació o procedència</label>'+
   '<input id="research-author" type="text" maxlength="250" placeholder="Ex.: Endesa Basket Lover">'+
   '<label for="research-description">Notes sobre aquest material</label>'+
   '<textarea id="research-description" rows="3" placeholder="Per què és rellevant? Quines dades conté?"></textarea>'+
   '<div class="editor-actions"><button type="submit" class="primary">Desa i incorpora a la fitxa</button></div>';
  const feedback=create('p','material-feedback');
  feedback.hidden=true;
  form.append(feedback);
  formHost.append(form);
  const type=form.querySelector('#research-type');
  const titleInput=form.querySelector('#research-title');
  const urlInput=form.querySelector('#research-url');
  const fileInput=form.querySelector('#research-file');
  const authorInput=form.querySelector('#research-author');
  const description=form.querySelector('#research-description');
  function switchType(){
   const value=type.value;
   form.querySelector('#research-link-fields').hidden=value!=='link';
   form.querySelector('#research-file-fields').hidden=value!=='file';
   urlInput.required=value==='link';
   fileInput.required=value==='file';
  }
  type.onchange=switchType;switchType();
  form.onsubmit=async event=>{
   event.preventDefault();
   if(!isCurrent()||!WF.isEditor())return;
   const kind=type.value,sourceTitle=titleInput.value.trim(),url=urlInput.value.trim();
   if(sourceTitle.length<3){showMessage(feedback,'Introdueix un títol de tres caràcters o més.',true);return}
   if(kind==='link'){
    try{const parsed=new URL(url);
     if(parsed.protocol!=='https:'||!parsed.hostname)throw new Error('HTTPS obligatori');
    }catch{showMessage(feedback,'Cal un enllaç HTTPS vàlid.',true);return}
   }
   const file=kind==='file'?fileInput.files?.[0]:null;
   if(kind==='file'){
    if(!file){showMessage(feedback,'Selecciona un fitxer.',true);return}
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(!allowedExt.has(ext)){showMessage(feedback,'Format no admès. Utilitza PDF, imatge, Word o TXT.',true);return}
    if(!file.size||file.size>MAX_FILE_SIZE){showMessage(feedback,'El fitxer ha de tenir un màxim de 20 MB.',true);return}
   }
   const button=form.querySelector('button[type=submit]');
   button.disabled=true;
   showMessage(feedback,'Desant el material…',false);
   let uploadedPath=null;
   try{
    const payload={
     target_kind:target,target_id:String(recordId),material_type:kind,title:sourceTitle,
     url:kind==='link'?url:null,
     description:description.value.trim(),
     source_author:authorInput.value.trim()||null,
     created_by:me.id
    };
    if(kind==='file'){
     const sanitized=file.name.normalize('NFKD').replace(/[^a-zA-Z0-9_.-]/g,'_').slice(-95);
     const path=me.id+'/research/'+crypto.randomUUID()+'-'+sanitized;
     const {error}=await db.storage.from(BUCKET).upload(path,file,{
      cacheControl:'3600',upsert:false,contentType:file.type||'application/octet-stream'
     });
     if(error)throw error;
     uploadedPath=path;
     payload.file_path=path;payload.file_name=file.name.slice(0,255);
     payload.file_size=file.size;payload.mime_type=file.type||null;
    }
    const {data:saved,error}=await db.from(TABLE).insert(payload).select('id').single();
    if(error)throw error;
    if(!saved?.id)throw new Error('El servidor no ha confirmat que el material s’hagi desat');
    uploadedPath=null;
    form.reset();switchType();
    await fetchList();
    showMessage(feedback,'Desat a l’arxiu i vinculat a aquesta fitxa. Apareix a la llista de materials; cap decisió editorial modificada.',false);
    section.scrollIntoView({behavior:'smooth',block:'nearest'});
   }catch(err){
    const msg=errorMessage(err);
    if(uploadedPath){
     // Esborrar només l'objecte acabat de pujar, si la fitxa de material no s'ha pogut crear.
     const {error:cleanupError}=await db.storage.from(BUCKET).remove([uploadedPath]);
     showMessage(feedback,'No s’ha pogut desar el material: '+msg+
      (cleanupError?' El fitxer temporal no s’ha pogut netejar.':' El fitxer temporal s’ha eliminat.'),true);
    }else showMessage(feedback,'No s’ha pogut desar el material: '+msg,true);
   }finally{button.disabled=false}
  };
 }
 await fetchList();
}
window.ArchiveResearch={render:renderMaterials,openPrivateFile};
})();