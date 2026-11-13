/* Fonts unificades — separat de decisions editorials. */
(function(){
'use strict';
const WF=window.ArchiveWorkflow;
if(!WF)return;
const bucket='arxiu-historic-privat';
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const text=(root,label,value)=>{
 if(value==null||value==='')return;
 const line=el('p','source-description');
 if(label)line.append(el('strong','',label+': '));
 line.append(document.createTextNode(String(value)));root.append(line);
};
const note=(root,value)=>root.append(el('p','mini-help',value));
function sourceLink(root,label,value){
 try{
  const url=new URL(String(value||''));if(url.protocol!=='https:')return;
  const row=el('div','source-document-row');
  row.append(el('strong','',label));
  const link=el('a','source-open','Obre la font');
  link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
  row.append(link);root.append(row);
 }catch{}
}
function ref(root,label,value){
 if(!value)return;
 const row=el('div','source-document-row');
 row.append(el('strong','',label));
 text(row,'',value);root.append(row);
}
async function documentCard(parent,source,alive,canUpload=true){
 if(!alive())return;
 const card=el('div','source-document-row source-file-card');
 card.append(el('strong','',source.title||source.id));
 if(source.kind)card.append(WF.tag(source.kind,'neutral'));
 text(card,'Autor',source.author);
 text(card,'Nom original',source.original_filename);
 text(card,'Data',source.document_date);
 text(card,'Bibliografia',source.bibliography);
 if(source.storage_path){
  const pdf=(source.kind==='PDF')||/\.pdf$/i.test(source.original_filename||'');
  const image=/\.(jpe?g|png|webp)$/i.test(source.original_filename||'');
  card.append(el('p','source-available','Document disponible al repositori privat'));
  const btn=el('button','source-file-button',pdf?'Visualitza el PDF':image?'Visualitza la imatge':'Descarrega el Word o document');
  btn.type='button';const preview=el('div','document-preview');
  btn.onclick=async()=>{
   btn.disabled=true;
   try{
    await window.ArchiveResearch.openPrivateFile(source.storage_path,
      source.original_filename||source.title,pdf?'application/pdf':'',preview);
   }catch(error){WF.showError('No es pot obrir el document: '+(error?.message||error))}
   finally{btn.disabled=false}
  };
  card.append(btn,preview);
 }else if(source.original_filename){
  let alternative=null;
  if(/\.pdf$/i.test(source.original_filename)){
   const {data,error}=await db.from('archive_source_variants')
    .select('storage_path,actual_sha256,actual_bytes,file_name,reviewed_at')
    .eq('source_id',source.id).maybeSingle();
   if(error)card.append(el('p','source-missing','No es pot consultar l’estat de les versions alternatives: '+error.message));
   else alternative=data;
  }
  if(alternative){
   card.append(el('p','source-available',
    'Versió alternativa conservada (PDF revisat manualment). La còpia exacta de l’inventari continua pendent.'));
   text(card,'SHA-256 de la versió alternativa',alternative.actual_sha256);
   text(card,'Mida de la versió alternativa',alternative.actual_bytes+' bytes');
   const altButton=el('button','source-file-button','Visualitza la versió alternativa');
   altButton.type='button';
   const altPreview=el('div','document-preview');
   altButton.onclick=async()=>{
    altButton.disabled=true;
    try{await window.ArchiveResearch.openPrivateFile(
     alternative.storage_path,alternative.file_name,'application/pdf',altPreview)}
    catch(error){WF.showError('No es pot obrir la versió alternativa: '+(error?.message||error))}
    finally{altButton.disabled=false}
   };
   card.append(altButton,altPreview);
  }else if(!card.querySelector('.source-missing')){
   card.append(el('p','source-missing',
    'Original inventariat però encara no pujat a Supabase. No es pot obrir fins que es vinculi el fitxer.'));
  }
  if(WF.isEditor()&&canUpload&&source.original_sha256){
   const form=el('form','source-upload-original');
   const label=el('label','','Selecciona el document original');
   const file=el('input');file.type='file';file.required=true;
   file.accept=/\.(jpe?g|png|webp)$/i.test(source.original_filename||'')?
     '.jpg,.jpeg,.png,.webp':/\.docx?$/i.test(source.original_filename||'')?
     '.doc,.docx':'.pdf';
   label.append(file);
   const btn=el('button','','Desa i vincula el fitxer original');btn.type='submit';
   const feedback=el('p','material-feedback');feedback.hidden=true;
   form.append(label,btn,feedback);card.append(form);
   form.onsubmit=async event=>{
    event.preventDefault();if(!alive()||!WF.isEditor())return;
    const chosen=file.files?.[0];
    if(!chosen)return;
    btn.disabled=true;feedback.hidden=false;feedback.textContent='Verificant la integritat del document…';
    let path=null;
    try{
     if(chosen.size>20*1024*1024)throw new Error('Màxim 20 MB');
     const bytes=Number(source.metadata?.manifest?.bytes||0);
     if(bytes&&chosen.size!==bytes)throw new Error('La mida no coincideix amb la font inventariada');
     if(!crypto.subtle)throw new Error('La comprovació de l’original no està disponible en aquest navegador');
     const digest=await crypto.subtle.digest('SHA-256',await chosen.arrayBuffer());
     const hex=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
     if(hex.toLowerCase()!==String(source.original_sha256).toLowerCase())
      throw new Error('SHA-256 diferent: aquest no és l’original inventariat');
     if(!/^[A-Za-z0-9_-]+$/.test(String(source.id)))throw new Error('ID de font no vàlid');
     const name=(source.original_filename||chosen.name).normalize('NFKD').replace(/[^A-Za-z0-9_.-]/g,'_').slice(-90);
     path=me.id+'/archive-sources/'+source.id+'/'+crypto.randomUUID()+'-'+name;
     const {error:upError}=await db.storage.from(bucket).upload(path,chosen,{upsert:false,contentType:chosen.type||'application/octet-stream'});
     if(upError)throw upError;
     const {data:updated,error:linkError}=await db.from('archive_sources')
      .update({storage_path:path}).eq('id',source.id).is('storage_path',null).select('id');
     if(linkError)throw linkError;
     if(!updated?.length)throw new Error('El fitxer ja s’ha vinculat en una altra sessió');
     source.storage_path=path;path=null;
     await documentCard(parent,source,alive,false);
     card.remove();
    }catch(error){
     if(path)await db.storage.from(bucket).remove([path]);
     feedback.className='material-feedback material-feedback-error';
     feedback.textContent='No s’ha pogut vincular: '+(error?.message||error);
     btn.disabled=false;
    }
   };
  }
 }
 parent.append(card);
}
async function relatedDocuments(root,kind,record,alive){
 const ids=new Set();
 const chapters=[];
 if(record.source_id)ids.add(String(record.source_id));
 if(kind==='proposal'&&Array.isArray(record.chapters)){
  const ordinals=record.chapters.map(Number).filter(Number.isInteger).slice(0,50);
  if(ordinals.length){
   const {data}=await db.from('archive_chapters').select('id,title,ordinal,source_id,printed_page')
     .in('ordinal',ordinals).limit(50);
   chapters.push(...(data||[]));
  }
 }
 if(kind==='calendar'){
  // Possible associació documental importada: no pressuposa revisió editorial.
  const {data}=await db.from('archive_proposals')
    .select('id,title,source_label,chapters,status')
    .eq('linked_calendar_id',record.id).limit(15);
  if(data?.length){
   const box=el('div','source-related-group');
   box.append(el('h5','','Referències de propostes relacionades (encara per contrastar)'));
   for(const p of data){
    ref(box,p.title,p.source_label||p.status);
    const nums=(p.chapters||[]).map(Number).filter(Number.isInteger).slice(0,30);
    if(nums.length){
     const {data:rows}=await db.from('archive_chapters')
       .select('id,title,ordinal,source_id,printed_page').in('ordinal',nums).limit(30);
     chapters.push(...(rows||[]));
    }
   }
   if(alive())root.append(box);
  }
 }
 for(const ch of chapters)if(ch.source_id)ids.add(ch.source_id);
 if(chapters.length&&alive()){
  const box=el('div','source-related-group');
  box.append(el('h5','','Capítols documentals vinculats'));
  const done=new Set();
  for(const ch of chapters){
   if(done.has(ch.id))continue;done.add(ch.id);
   ref(box,'Capítol '+ch.ordinal+': '+ch.title,ch.printed_page?'Pàgina '+ch.printed_page:'Capítol del llibre');
  }
  root.append(box);
 }
 if(kind==='source')ids.delete(String(record.id));
 if(ids.size){
  const {data,error}=await db.from('archive_sources')
   .select('id,title,kind,author,document_date,original_filename,original_sha256,storage_path,bibliography,metadata')
   .in('id',[...ids].slice(0,30)).limit(30);
  if(error){note(root,'No es poden consultar algunes fonts: '+error.message);return}
  if(data?.length&&alive()){
   const box=el('div','source-related-group');
   box.append(el('h5','','Documents originals vinculats'));
   for(const s of data)await documentCard(box,s,alive);
   root.append(box);
  }
 }
 if(kind==='person'){
  const {data:links}=await db.from('archive_person_event_links')
   .select('calendar_id').eq('person_id',record.id).limit(25);
  const calendarIds=(links||[]).map(x=>x.calendar_id).filter(Boolean);
  if(calendarIds.length){
   const {data:entries}=await db.from('archive_calendar_baseline')
     .select('title,source_url').in('id',calendarIds).limit(25);
   if(entries?.length&&alive()){
    const box=el('div','source-related-group');
    box.append(el('h5','','Fonts de les efemèrides vinculades a aquesta persona'));
    for(const e of entries)sourceLink(box,e.title,e.source_url);
    root.append(box);
   }
  }
 }
}
async function render(container,kind,record,alive=()=>true){
 if(!record||!alive())return;
 const box=el('section','detail-section sources-hub');
 box.append(el('h4','','Fonts i documents de la fitxa'));
 note(box,'Aquí tens la font original, els documents vinculats i tots els materials que hagis incorporat, encara que no publiquis aquesta efemèride.');
 const direct=el('div','source-originals');
 const originalURL=record.source_url||record.raw_original?.['Font (URL)']||record.raw_original?.source;
 sourceLink(direct,'Font web original',originalURL);
 if(record.source_label)ref(direct,'Font documental original',record.source_label);
 if(record.bibliography&&kind!=='source')ref(direct,'Bibliografia',record.bibliography);
 if(record.chapters_label)ref(direct,'Capítols citats',record.chapters_label);
 if(kind==='source')await documentCard(direct,record,alive);
 if(direct.childNodes.length){
  box.append(el('h5','','Fonts d’origen'));
  box.append(direct);
 }
 const related=el('div','source-related');
 box.append(related);
 container.append(box);
 try{
  const linked=relatedDocuments(related,kind,record,alive);
  if(window.ArchiveResearch?.render)
   await window.ArchiveResearch.render(box,kind,String(record.id),alive,{embedded:true});
  await linked;
  if(!alive())return;
  if(!related.childNodes.length)related.remove();
 }catch(error){
  if(alive())note(box,'Error en recuperar algunes fonts: '+(error?.message||error));
 }
}
window.ArchiveSourcesHub={render};
})();