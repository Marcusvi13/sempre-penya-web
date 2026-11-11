/* Navegació universal de pàgines: tots els llistats de l'Arxiu Històric. */
(function(){
'use strict';
const get=id=>document.getElementById(id);
const originalPrev=get('prev'),originalNext=get('next');
const footer=originalPrev?.parentElement;
if(!footer)return;
originalPrev.hidden=true;originalNext.hidden=true;
const region=document.createElement('nav');
region.id='archive-pagination';
region.className='archive-pagination';
region.setAttribute('aria-label','Navegació de pàgines');
footer.append(region);
const summary=document.createElement('div');
summary.className='pagination-summary';
const buttons=document.createElement('div');buttons.className='pagination-buttons';
const jump=document.createElement('form');jump.className='pagination-jump';
const jumpLabel=document.createElement('label');jumpLabel.textContent='Ves a la pàgina';jumpLabel.htmlFor='archive-page-number';
const jumpInput=document.createElement('input');jumpInput.type='number';jumpInput.min='1';jumpInput.step='1';
jumpInput.id='archive-page-number';jumpInput.setAttribute('aria-label','Número de pàgina');
const jumpButton=document.createElement('button');jumpButton.type='submit';jumpButton.textContent='Anar';
jump.append(jumpLabel,jumpInput,jumpButton);
region.append(summary,buttons,jump);
function pagesCount(){return Math.max(1,Math.ceil(total/limit))}
function go(target){
 const last=pagesCount()-1;
 const next=Math.max(0,Math.min(last,Math.trunc(Number(target))));
 if(!Number.isFinite(next)||next===page)return;
 page=next;selected=null;
 loadData();
 // Retorn a l'inici de la llista quan es canvia de pàgina.
 get('list-label')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function addButton(text,target,disabled,title,isCurrent=false){
 const b=document.createElement('button');b.type='button';b.textContent=text;
 if(title)b.title=title;
 b.disabled=disabled;
 if(isCurrent){b.className='active';b.setAttribute('aria-current','page')}
 b.onclick=()=>go(target);
 buttons.append(b);
}
function ellipsis(){
 const span=document.createElement('span');span.className='pagination-ellipsis';span.textContent='…';buttons.append(span);
}
function draw(){
 const count=pagesCount(),current=page+1;
 summary.textContent=total.toLocaleString('ca-ES')+' registres · pàgina '+current+' de '+count;
 get('page-info').textContent='Pàgina '+current+' / '+count;
 jumpInput.max=String(count);
 jumpInput.value=String(current);
 buttons.replaceChildren();
 addButton('« Primera',0,page===0,'Ves a la primera pàgina');
 addButton('−10',page-10,page===0,'Retrocedeix fins a 10 pàgines');
 addButton('‹',page-1,page===0,'Pàgina anterior');
 // Primera, última i una finestra de cinc pàgines, amb punts suspensius si escau.
 const wanted=new Set([1,count]);
 for(let p=Math.max(1,current-2);p<=Math.min(count,current+2);p++)wanted.add(p);
 if(current<=3)for(let p=1;p<=Math.min(5,count);p++)wanted.add(p);
 if(current>=count-2)for(let p=Math.max(1,count-4);p<=count;p++)wanted.add(p);
 const ordered=[...wanted].sort((a,b)=>a-b);
 let prev=0;
 for(const number of ordered){
  if(number>prev+1)ellipsis();
  addButton(String(number),number-1,number===current,'Ves a la pàgina '+number,number===current);
  prev=number;
 }
 addButton('›',page+1,page>=count-1,'Pàgina següent');
 addButton('+10',page+10,page>=count-1,'Avança fins a 10 pàgines');
 addButton('Última »',count-1,page>=count-1,'Ves a l’última pàgina');
 jump.hidden=count===1;
}
jump.onsubmit=event=>{
 event.preventDefault();
 if(jumpInput.value.trim()==='')return;
 const value=Number(jumpInput.value);
 if(!Number.isInteger(value)||value<1||value>pagesCount()){
  jumpInput.setCustomValidity('Tria una pàgina entre 1 i '+pagesCount());
  jumpInput.reportValidity();
  return;
 }
 jumpInput.setCustomValidity('');
 go(value-1);
};
jumpInput.oninput=()=>jumpInput.setCustomValidity('');
const baseLoad=loadData;
loadData=async function(...args){
 try{return await baseLoad(...args)}
 finally{draw()}
};
draw();
if(db&&!get('dashboard').hidden)loadData();
})();
