// Simulates the ACTUAL mobile review controller and clicks. No network, no database.
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"..","revisio-lot.html"),"utf8");
const js=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(Boolean);
assert.ok(js,"Review controller missing");
const sources=[
 {id:"11111111-1111-4111-8111-111111111111",token:"a".repeat(64),
  source:"Club Joventut Badalona · Instagram",url:"https://www.instagram.com/reel/DfHTS9Ho1Hh/",
  date:"2026-10-30T09:53:36Z",
  context:"Hi ha camins que no es fan sol. Mini documental complet a https://youtu.be/C9p6a6Yrt8k"},
 {id:"22222222-2222-4222-8222-222222222222",token:"b".repeat(64),
  source:"Club Joventut Badalona · X",url:"https://x.com/Penya1930/status/2116107860446990458",
  date:"2026-10-30T10:00:03Z",
  context:"Hi ha camins que no es fan sol. Mini documental complet a https://youtu.be/C9p6a6Yrt8k en col·laboració"}
];
class FakeElement{
 constructor(tag){this.tagName=tag.toUpperCase();this.className="";this.children=[];this.style={};this.dataset={};this.events={};this.attrs={};this.hidden=false;this.disabled=false;this.checked=false;this.value="";this.textContent="";}
 append(child){this.children.push(child);child.parent=this;return child;}
 replaceChildren(...children){this.children=children;}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,cb){(this.events[k]??=[]).push(cb);}
 dispatch(k){for(const cb of this.events[k]||[])cb();}
 scrollIntoView(){}
 add(option){this.children.push(option);}
 get classList(){return{
  contains:c=>this.className.split(/\s+/).includes(c),
  add:c=>{if(!this.className.split(/\s+/).includes(c))this.className+=(this.className?" ":"")+c;}
 };}
}
function descendants(root){
 const list=[];
 const visit=(n)=>{if(!n)return;list.push(n);for(const c of n.children||[])visit(c);};
 visit(root);return list;
}
function makeHarness(reverse=false,otherVideo=false){
 const reviews=reverse?[...sources].reverse():sources;
 const root={};
 for(const id of ["notice","items","counter","saveFeedback","save"])root[id]=new FakeElement(id==="save"?"button":"div");
 const document={
  createElement(tag){return new FakeElement(tag);},
  getElementById(id){return root[id];},
  querySelectorAll(selector){
   const cards=root.items.children.filter(e=>e.className.split(/\s+/).includes("card"));
   if(selector===".card")return cards;
   if(selector.includes("input[value='publish']:checked")&&selector.includes("input[value='discard']:checked")){
    return cards.filter(c=>!c.classList.contains("done")).flatMap(c=>descendants(c).filter(e=>e.tagName==="INPUT"&&e.checked&&(e.value==="publish"||e.value==="discard")));
   }
   throw Error("Unexpected DOM selector: "+selector);
  }
 };
 const calls=[];
 const fetch=async(_url,opts)=>{
  const req=JSON.parse(opts.body);
  calls.push(req);
  const r=reviews.find(x=>x.id===req.id);
  assert.ok(r,"Fake review ID must exist");
  let data;
  if(req.action==="read")data={id:r.id,url:r.url,source:r.source,title:"Ante Tomic",status:"pending",
    context:otherVideo&&r.source.endsWith(" · X")?"A different video":r.context,
    published_at:r.date,first_detected_at:"2026-10-30T12:45:00Z",reason:"Comprovada",matches:[]};
  else if(req.action==="probe_pair")data={ok:true,dry_run:true,result:{paired:true,status:"published"}};
  else if(req.action==="publish_pair")data={status:"published",paired:true,news_id:"single-news-id"};
  else if(req.action==="publish")throw Error("BUG: a verified pair was published as a single post");
  else throw Error("Unexpected request: "+req.action);
  return {ok:true,json:async()=>data};
 };
 const hash="#"+reviews.map(r=>r.id+"."+r.token).join("~");
 const context={document,fetch,window:{PENYA_EDITORIAL_REASONS:{
   publish:[["format_value","Vídeo"],["new_information","Informació nova"]],
   discard:[["duplicate","Duplicat"]]
 }},location:{hash,search:"",pathname:"/revisio-lot.html"},
 history:{replaceState(){}},URLSearchParams,Date,Option:class{constructor(text,value){this.text=text;this.value=value;}},
 console};
 vm.runInNewContext(js,context,{filename:"revisio-lot.html",timeout:4000});
 return {calls,root,document,reviews};
}
function radioFor(card,value){return descendants(card).find(e=>e.tagName==="INPUT"&&e.type==="radio"&&e.value===value);}
function choice(card){return card._payload();}
async function ready(h){
 for(let i=0;i<20&&h.root.items.children.length!==2;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.root.items.children.length,2,"Both social reviews must load");
}
async function run(reverse){
 const h=makeHarness(reverse);
 await ready(h);
 const [first,second]=h.root.items.children;
 const target=h.reviews[0];
 const pair=h.reviews[1];
 // At this moment both are Omet; selecting Publica must retain preselected pair.
 let payload=choice(first);
 assert.equal(payload.related_id,pair.id,"Verified exact same-video review must preselect counterpart");
 assert.equal(payload.confirm_pair,true,"Verified pair must be ready to save together");
 const publish=radioFor(first,"publish");
 const omit=radioFor(first,"");
 assert.ok(publish&&omit);
 omit.checked=false;publish.checked=true;publish.dispatch("change");
 payload=choice(first);
 assert.equal(payload.action,"publish");
 assert.equal(payload.related_id,pair.id,"Clicking Publica must not reset verified pairing");
 assert.equal(payload.related_token,pair.token);
 assert.equal(payload.confirm_pair,true);
 assert.equal(choice(second).action,"","Counterpart remains Omet");
 const selects=descendants(first).filter(e=>e.tagName==="SELECT");
 const editorial=selects.find(e=>e!==null&&e.children.some(c=>c.value==="format_value"));
 assert.ok(editorial,"Editorial reason selector missing");
 editorial.value="format_value";
 assert.equal(h.root.save.disabled,false,"Save must be enabled");
 await h.root.save.onclick();
 assert.deepEqual(h.calls.filter(c=>c.action!=="read").map(c=>c.action),["probe_pair","publish_pair"]);
 const pub=h.calls.find(c=>c.action==="publish_pair");
 assert.equal(pub.id,target.id);
 assert.equal(pub.related_id,pair.id);
 assert.equal(pub.related_token,pair.token);
 assert.equal(pub.confirm_pair,true);
 assert.ok(first.classList.contains("done")&&second.classList.contains("done"),
   "Both original reviews must resolve from a single publication");
}
(async()=>{
 await run(false);
 await run(true);
 const h=makeHarness(false,true);
 await ready(h);
 assert.equal(choice(h.root.items.children[0]).related_id,"",
   "A different video must not be silently grouped");
 console.log("PASS: real DOM events on both orientations, one probe and one pair commit, never a solo publication");
})().catch(err=>{console.error(err);process.exitCode=1;});
