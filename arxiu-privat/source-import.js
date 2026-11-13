/* Importació massiva dels originals de l'Arxiu Històric de la Penya.
 * Només navegador autenticat, bucket privat, verificació SHA-256 i mida.
 * L'únic camp de la fitxa original que es modifica és archive_sources.storage_path.
 * No hi ha cap servei extern de tercers ni cap pujada al repositori GitHub.
 */
(function(){
'use strict';
const WF=window.ArchiveWorkflow;
if(!WF)return;
const BUCKET='arxiu-historic-privat';
const MAX_BYTES=20*1024*1024;
const st={
 sources:[],files:new Map(),matches:new Map(),failures:new Map(),
 unmatched:[],checked:false,verifying:false,uploading:false,stop:false,
 phase:'',loaded:false,processed:0,runTotal:0,completedThisRun:0,
 host:null,ui:null,sequence:0
};
const create=(tag,cls,text)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text!==undefined)e.textContent=String(text);
 return e;
};
const errText=e=>e?.message||e?.error_description||String(e||'Error desconegut');
const sizeOf=s=>Number(s.metadata?.manifest?.bytes||0);
const filename=s=>s.original_filename||'';
function setNotice(message,isError=false){
 if(!st.ui)return;
 st.ui.notice.hidden=!message;
 st.ui.notice.textContent=message||'';
 st.ui.notice.className=isError?'material-feedback material-feedback-error':'material-feedback material-feedback-ok';
}
function fileKey(file){
 return [file.webkitRelativePath||file.name,file.size,file.lastModified||0].join('\u0001');
}
function isBusy(){return st.verifying||st.uploading}
function pause(){
 if(st.uploading){st.stop=true;setNotice('Pausa sol·licitada: acabarem el fitxer en curs i ens aturarem.')}
}
const countUploaded=()=>st.sources.filter(s=>Boolean(s.storage_path)).length;
const pending=()=>st.sources.filter(s=>!s.storage_path);
const ready=()=>pending().filter(s=>st.matches.has(s.id));
function renderStats(){
 if(!st.ui)return;
 const {stats,upload,verify,pauseButton,progress,detailTable}=st.ui;
 const done=countUploaded(),waiting=st.sources.length-done;
 const matched=ready().length;
 stats.replaceChildren();
 const cells=[
  ['Originals inventariats',st.sources.length],
  ['Pujats i vinculats',done],
  ['Pendents',waiting],
  ['Verificats per pujar',matched],
  ['Errors de pujada',st.failures.size]
 ];
 cells.forEach(([label,value])=>{
  const box=create('div','archive-import-stat');
  box.append(create('strong','',value),create('span','',label));stats.append(box);
 });
 const pct=st.runTotal?Math.round(st.processed/st.runTotal*100):0;
 progress.hidden=!st.uploading&&st.runTotal===0;
 progress.value=st.processed;progress.max=Math.max(1,st.runTotal);
 progress.title=st.runTotal?st.processed+' de '+st.runTotal+' fitxers gestionats ('+pct+'%)':'';
 verify.disabled=isBusy()||!st.files.size;
 upload.disabled=isBusy()||!matched;
 pauseButton.disabled=!st.uploading||st.stop;
 st.ui.fileCount.textContent=st.files.size+' fitxers seleccionats'
  +(st.checked?' · '+matched+' fonts verificades'+(st.unmatched.length?' · '+st.unmatched.length+' fitxers sense correspondència':''):'');
 st.ui.phase.textContent=st.phase;
 detailTable.replaceChildren();
 const fragment=document.createDocumentFragment();
 st.sources.forEach(s=>{
  const tr=create('tr');
  const status=s.storage_path?'Pujat i vinculat':st.failures.has(s.id)?'Error: '+st.failures.get(s.id):
   st.matches.has(s.id)?'Verificat, pendent de pujar':'Pendent de seleccionar';
  for(const value of [s.id,filename(s),Math.round(sizeOf(s)/1024)+' KB',status]){
   tr.append(create('td','',value));
  }
  fragment.append(tr);
 });
 detailTable.append(fragment);
 const unmatchedList=st.ui.unmatched;
 unmatchedList.replaceChildren();
 if(st.unmatched.length){
  const n=create('details','archive-import-unmatched');
  n.append(create('summary','','Fitxers sense correspondència ('+st.unmatched.length+')'));
  const l=create('ul');
  st.unmatched.slice(0,150).forEach(x=>l.append(create('li','',x)));
  n.append(l);unmatchedList.append(n);
 }
}
function mount(host){
 const shell=create('div','archive-import-content');
 shell.innerHTML=
  '<h2>Importació dels 136 documents originals</h2>'+
  '<p class="muted">Els PDF, Word i fotografies s’enviaran directament del teu ordinador al magatzem privat de l’Arxiu Històric. No es publicaran a Sempre Penya ni canviaran les decisions editorials.</p>'+
  '<div class="archive-import-stats" id="archive-import-stats"></div>'+
  '<h3>1. Selecciona els fitxers originals</h3>'+
  '<p class="mini-help">Pots seleccionar diversos fitxers d’un sol cop o tota una carpeta amb subcarpetes. Si estan repartits en carpetes, pots repetir l’operació. No cal escollir-los d’un en un.</p>'+
  '<div class="archive-import-pickers">'+
   '<label for="archive-import-files">Fitxers (selecció múltiple)<input id="archive-import-files" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"></label>'+
   '<label for="archive-import-folder">Carpeta sencera (Chrome/Edge)<input id="archive-import-folder" type="file" multiple webkitdirectory></label>'+
  '</div>'+
  '<p id="archive-import-file-count" class="mini-help">Encara no s’han seleccionat fitxers.</p>'+
  '<div class="archive-import-actions">'+
   '<button id="archive-import-verify" type="button">Comprova integritat SHA-256</button>'+
   '<button id="archive-import-start" type="button" class="primary">Puja els originals verificats</button>'+
   '<button id="archive-import-pause" type="button">Atura després del fitxer actual</button>'+
   '<button id="archive-import-refresh" type="button">Actualitza l’inventari</button>'+
   '<button id="archive-import-export" type="button">Descarrega inventari CSV</button>'+
  '</div>'+
  '<progress id="archive-import-progress" value="0" max="1" hidden></progress>'+
  '<p id="archive-import-phase" class="mini-help" role="status"></p>'+
  '<p id="archive-import-notice" class="material-feedback" hidden role="alert"></p>'+
  '<h3>2. Estat dels originals</h3>'+
  '<p class="mini-help">Només vincularem un fitxer si coincideix exactament amb la mida i la seva empremta SHA-256 de l’inventari. Els originals ja vinculats es respecten i no es tornen a pujar.</p>'+
  '<details class="archive-import-details"><summary>Mostra el detall dels 136 documents i el seu estat</summary>'+
   '<div class="archive-import-table-wrap"><table><thead><tr><th>ID</th><th>Fitxer</th><th>Mida</th><th>Estat</th></tr></thead><tbody id="archive-import-table"></tbody></table></div>'+
  '</details>'+
  '<div id="archive-import-unmatched"></div>'+
  '<p class="mini-help">Pots tancar la sessió i reprendre la importació un altre dia: la base de dades manté els fitxers ja vinculats. Si interromps una pujada, torna a seleccionar la carpeta i repeteix la comprovació abans de continuar.</p>';
 host.replaceChildren(shell);
 const e=id=>shell.querySelector('#'+id);
 st.ui={
  stats:e('archive-import-stats'),files:e('archive-import-files'),
  folder:e('archive-import-folder'),fileCount:e('archive-import-file-count'),
  verify:e('archive-import-verify'),upload:e('archive-import-start'),
  pauseButton:e('archive-import-pause'),refresh:e('archive-import-refresh'),
  export:e('archive-import-export'),progress:e('archive-import-progress'),
  notice:e('archive-import-notice'),phase:e('archive-import-phase'),
  detailTable:e('archive-import-table'),unmatched:e('archive-import-unmatched')
 };
 st.ui.files.onchange=event=>{
  addFiles(event.target.files);
  event.target.value='';
 };
 st.ui.folder.onchange=event=>{
  addFiles(event.target.files);
  event.target.value='';
 };
 st.ui.verify.onclick=verifySelected;
 st.ui.upload.onclick=uploadMatched;
 st.ui.pauseButton.onclick=pause;
 st.ui.refresh.onclick=async()=>{if(isBusy())return;await refreshInventory()};
 st.ui.export.onclick=exportInventory;
 renderStats();
}
function addFiles(files){
 if(isBusy()){setNotice('Cal acabar la verificació o aturar la pujada abans d’afegir fitxers.',true);return}
 for(const file of Array.from(files||[])){
  if(!file||!Number.isFinite(file.size))continue;
  st.files.set(fileKey(file),file);
 }
 st.checked=false;st.matches.clear();st.unmatched=[];
 st.failures.clear();st.runTotal=0;st.processed=0;
 st.phase='Seleccionats '+st.files.size+' fitxers. Prem «Comprova integritat SHA-256».';
 setNotice('');renderStats();
}
async function refreshInventory(){
 if(!WF.isEditor()){
  setNotice('Només els comptes editors poden incorporar originals.',true);
  return;
 }
 const seq=++st.sequence;
 st.phase='Consultant l’inventari privat…';renderStats();
 const {data,error}=await db.from('archive_sources')
  .select('id,title,kind,original_filename,original_sha256,storage_path,metadata')
  .order('id',{ascending:true}).limit(500);
 if(seq!==st.sequence)return;
 if(error){setNotice('No s’ha pogut consultar l’inventari: '+errText(error),true);return false}
 st.sources=data||[];
 st.loaded=true;
 // Si un altre editor ha enllaçat un original, no el tornarem a pujar.
 for(const s of st.sources)if(s.storage_path){st.matches.delete(s.id);st.failures.delete(s.id)}
 st.phase='Inventari actualitzat. '+countUploaded()+' originals vinculats; '+pending().length+' pendents.';
 renderStats();
 return true;
}
async function render(host){
 if(!st.ui||st.host!==host){
  st.host=host;mount(host);
 }
 if(!isBusy())await refreshInventory();
 else renderStats();
}
async function digest(file){
 const bytes=await file.arrayBuffer();
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
async function verifySelected(){
 if(isBusy())return;
 if(!window.crypto?.subtle){setNotice('Aquest navegador no disposa de SHA-256. Utilitza la web amb HTTPS a Chrome o Edge.',true);return}
 if(!st.loaded&&!(await refreshInventory()))return;
 if(!st.sources.length)return;
 st.verifying=true;st.checked=false;st.matches.clear();st.unmatched=[];
 st.phase='Comprovant fitxers un a un, sense enviar-los al servidor…';
 renderStats();
 try{
  const bySize=new Map();
  for(const src of pending()){
   const size=sizeOf(src);
   if(!size||!src.original_sha256)continue;
   const list=bySize.get(size)||[];list.push(src);bySize.set(size,list);
  }
  let examined=0;
  for(const file of st.files.values()){
   if(file.size>MAX_BYTES){st.unmatched.push(file.name+' — supera 20 MB');continue}
   const sources=bySize.get(file.size);
   if(!sources?.length){st.unmatched.push(file.name+' — mida no inventariada');continue}
   try{
    const sha=await digest(file);
    const found=sources.filter(s=>s.original_sha256.toLowerCase()===sha.toLowerCase());
    if(!found.length){
     st.unmatched.push(file.name+' — mida compatible però SHA-256 diferent');
     continue;
    }
    for(const src of found)if(!st.matches.has(src.id))st.matches.set(src.id,file);
   }catch(error){st.unmatched.push(file.name+' — error de lectura: '+errText(error))}
   examined++;
   if(examined%5===0){
    st.phase='Comprovant fitxers: '+examined+' amb mida inventariada…';
    renderStats();
   }
  }
  st.checked=true;
  st.phase='Verificació completa: '+ready().length+' originals llestos per pujar. '
    +st.unmatched.length+' fitxers sense correspondència.';
  setNotice(ready().length?'Verificació completada. Cap fitxer no s’ha pujat encara.':
   'No s’ha trobat cap fitxer pendent que coincideixi amb l’inventari.',!ready().length);
 }finally{st.verifying=false;renderStats()}
}
function sanitize(value){
 return String(value||'document').normalize('NFKD')
  .replace(/[^A-Za-z0-9_.-]/g,'_').slice(-96)||'document';
}
function mimeType(file,source){
 const name=filename(source).toLowerCase();
 if(name.endsWith('.pdf'))return 'application/pdf';
 if(name.endsWith('.docx'))return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 if(name.endsWith('.doc'))return 'application/msword';
 if(/\.jpe?g$/.test(name))return 'image/jpeg';
 if(name.endsWith('.png'))return 'image/png';
 if(name.endsWith('.webp'))return 'image/webp';
 return file.type||'application/octet-stream';
}
async function attachOne(src,file){
 // Es verifica una segona vegada just abans de la pujada. Mai no es vincula per nom només.
 const sha=await digest(file);
 if(file.size!==sizeOf(src)||sha.toLowerCase()!==src.original_sha256.toLowerCase())
  throw new Error('El document seleccionat ha canviat o no coincideix amb l’original');
 if(!/^[A-Za-z0-9_-]+$/.test(src.id))throw new Error('Identificador d’original no vàlid');
 const path=me.id+'/archive-sources/'+src.id+'/'+crypto.randomUUID()+'-'+sanitize(filename(src));
 const storage=db.storage.from(BUCKET);
 const {error:uploadError}=await storage.upload(path,file,{
  upsert:false,contentType:mimeType(file,src),cacheControl:'3600'
 });
 if(uploadError)throw uploadError;
 try{
  const {data,error}=await db.from('archive_sources')
   .update({storage_path:path})
   .eq('id',src.id).is('storage_path',null)
   .select('id,storage_path');
  if(error)throw error;
  if(!data?.length)throw new Error('La font ja ha canviat des de l’última consulta.');
  src.storage_path=path;
  return;
 }catch(err){
  // Pot haver-se desat encara que la resposta s’hagi perdut. Consultem abans de netejar.
  const {data:current,error:readError}=await db.from('archive_sources')
   .select('storage_path').eq('id',src.id).maybeSingle();
  if(!readError&&current?.storage_path===path){
   src.storage_path=path;return;
  }
  if(!readError){
   const {error:removeError}=await storage.remove([path]);
   if(removeError)throw new Error(errText(err)+'; cal revisar el fitxer temporal: '+errText(removeError));
  }else{
   throw new Error(errText(err)+'; no podem confirmar el resultat, no esborrem el fitxer temporal.');
  }
  throw err;
 }
}
async function uploadMatched(){
 if(isBusy()||!st.checked)return;
 if(!WF.isEditor()){setNotice('Aquest usuari no té permís d’edició.',true);return}
 if(!(await refreshInventory()))return;
 const jobs=ready();
 if(!jobs.length){setNotice('No hi ha originals pendents verificats per pujar.',true);return}
 if(!window.confirm('Pujar i vincular '+jobs.length+' originals verificats al repositori privat de la Penya?'))return;
 st.uploading=true;st.stop=false;
 st.runTotal=jobs.length;st.processed=0;st.completedThisRun=0;
 st.failures.clear();renderStats();
 try{
  for(const src of jobs){
   if(st.stop)break;
   const file=st.matches.get(src.id);
   st.phase='Pujant '+(st.processed+1)+'/'+st.runTotal+': '+src.id+' · '+filename(src);
   renderStats();
   try{
    await attachOne(src,file);
    st.completedThisRun++;
    st.matches.delete(src.id);
   }catch(error){
    st.failures.set(src.id,errText(error));
    // Si el compte ha perdut accés, és més segur no continuar.
    const msg=errText(error);
    if(/(?:401|403|JWT|token expired|permission denied|Unauthorized)/i.test(msg))st.stop=true;
   }
   st.processed++;
   renderStats();
  }
 }finally{
  st.uploading=false;
  await refreshInventory();
  st.phase='Procés finalitzat: '+st.completedThisRun+' originals vinculats en aquesta passada. '
    +st.failures.size+' errors; '+pending().length+' pendents en total.'
    +(st.stop?' Importació interrompuda.':'');
  setNotice(st.phase,st.failures.size>0);
  st.runTotal=0;st.processed=0;
  renderStats();
 }
}
function csvSafe(value){
 const text=String(value??'');
 const escaped=/^[=+@-]/.test(text)?"'"+text:text;
 return '"'+escaped.replace(/"/g,'""')+'"';
}
function exportInventory(){
 if(!st.sources.length)return;
 const header=['ID','Títol','Fitxer original','Bytes','SHA-256','Estat'];
 const lines=[header.map(csvSafe).join(';')];
 for(const s of st.sources){
  const state=s.storage_path?'Pujat':st.matches.has(s.id)?'Verificat':'Pendent';
  lines.push([s.id,s.title,filename(s),sizeOf(s),s.original_sha256,state].map(csvSafe).join(';'));
 }
 const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=create('a');
 a.href=url;a.download='arxiu-penya-inventari-fonts-originals.csv';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
window.ArchiveSourceImport={render,isBusy,pause};
})();