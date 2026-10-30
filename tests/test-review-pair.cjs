const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'..','revisio-lot.html'),'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(m=>m[1]).filter(Boolean);
assert.equal(scripts.length,1,'Expected one inline review controller');
const js = scripts[0];
new vm.Script(js,{filename:'revisio-lot.html'});
for(const fragment of [
 'function partnersFor(item)', 'function family(d)', 'function platform(d)',
 'publish_pair', 'related_id:pairSelect.value',
 'related_token:pairSelect.value', 'confirm_pair:pairConfirm.checked',
 'p.action==="publish"&&p.related_id', 'if(d.paired)',
 'confirm_possible_duplicate'
]){
 if(fragment !== 'confirm_possible_duplicate')
   assert.ok(js.includes(fragment),'Missing pair approval control '+fragment);
}
const mock = {
  items: [
    {id:'x',data:{status:'pending',source:'Club Joventut Badalona · X',
      published_at:'2026-10-30T10:00:03Z',title:'Ante Tomic'}},
    {id:'ig',data:{status:'pending',source:'Club Joventut Badalona · Instagram',
      published_at:'2026-10-30T09:53:36Z',title:'Ante Tomic'}},
    {id:'other',data:{status:'pending',source:'Esports BDN Comunicació · Instagram',
      published_at:'2026-10-30T09:53:36Z',title:'Notícia diferent'}},
    {id:'old',data:{status:'pending',source:'Club Joventut Badalona · Instagram',
      published_at:'2026-10-27T09:53:36Z',title:'Notícia antiga'}},
    {id:'decided',data:{status:'published',source:'Club Joventut Badalona · Instagram',
      published_at:'2026-10-30T09:53:36Z',title:'Ja decidida'}}
  ]
};
const run = vm.runInNewContext(
  js.slice(js.indexOf('function platform(d)'),js.indexOf('function pendingCount()'))
  + '\n partnersFor(items[0]).map(x=>x.id).join(",")',mock
);
assert.equal(run,'ig','Only same-source fresh pending other-platform post should qualify');
// An archived link for this exact X+Instagram pair is not a new duplicate.
const igUrl='https://www.instagram.com/reel/DfHTS9Ho1Hh/';
const xUrl='https://x.com/Penya1930/status/2116107860446990458';
mock.items[0].data.url=xUrl;
mock.items[1].data.url=igUrl;
const hidden={id:'archived',url:igUrl,published:false};
mock.items[0].data.matches=[hidden];
const unique=new Map(mock.items.map(i=>[i.id,i]));
const code=js.slice(js.indexOf('function platform(d)'),js.indexOf('function pendingCount()'));
const check=(matches)=>vm.runInNewContext(code+'\n onlyHiddenPairMatches(items[0],"ig")',
  {items:mock.items,unique});
assert.equal(check(),true,'Hidden exact pair is safe to reuse');
mock.items[0].data.matches=[{...hidden,published:true}];
assert.equal(check(),false,'Visible duplicate must require confirmation');
mock.items[0].data.matches=[{...hidden,url:'https://example.com/another-post'}];
assert.equal(check(),false,'Unrelated hidden news must require confirmation');
mock.items[0].data.matches=[hidden,{...hidden,url:'https://example.com/other-hidden'}];
assert.equal(check(),false,'Mixed matches must require confirmation');
const single=fs.readFileSync(path.join(__dirname,'..','revisio.html'),'utf8');
assert.ok(!html.includes('Confirmo que he revisat les coincidències i vull publicar igualment.'));
assert.ok(!single.includes('He revisat les coincidències i vull publicar aquesta peça igualment.'));
assert.ok(!single.includes('id="confirm"'));
assert.ok(!js.includes('confirm:conf.checked'));
assert.ok(js.includes('const check=await api(item,"probe_pair",p)'),
  'The live pair save must run automatic transactionally rolled-back preflight');
assert.ok(js.includes('check.ok!==true||check.dry_run!==true'),
  'The preflight must fail closed before the real publication action');
assert.ok(js.includes('confirm_pair:pairConfirm.checked'),
  'The meaningful crosspost approval must remain explicit');
// The specific historical Ante Tomic crosspost shares an exact verified YouTube ID.
const xCtx="Hi ha camins que no es fan sol. Mini documental complet a https://youtu.be/C9p6a6Yrt8k amb col·laboració";
const igCtx="Hi ha camins que no es fan sol. Mini documental complet a https://youtu.be/C9p6a6Yrt8k";
const xa={id:"penyax",data:{source:"Club Joventut Badalona · X",status:"pending",published_at:"2026-10-30T10:00:03Z",context:xCtx}};
const ig={id:"penyaig",data:{source:"Club Joventut Badalona · Instagram",status:"pending",published_at:"2026-10-30T09:53:36Z",context:igCtx}};
const helper=js.slice(js.indexOf("function platform(d)"),js.indexOf("function pendingCount()"));
const sharedVideo=new Function("a","b",helper+"return verifiedCrosspost(a,b);");
assert.equal(sharedVideo(xa,ig),true,"Exact shared video should be preselected");
assert.equal(sharedVideo(xa,{...ig,data:{...ig.data,context:"Un vídeo diferent"}}),false);
assert.equal(sharedVideo(xa,{...ig,data:{...ig.data,source:"Badalona Comunicació · Instagram"}}),false);
assert.equal(sharedVideo(xa,{...ig,data:{...ig.data,published_at:"2026-10-30T05:00:00Z"}}),false);
assert.ok(js.includes("pairSelect.value=verifiedPartner.id"),"Verified pair must be actually selected, not just suggested");
assert.ok(js.includes("pairConfirm.checked=true"),"Automatic verified match needs atomic paired path");
assert.ok(js.includes("Parella social verificada"),"Already-paired single reviews should describe their other platform");
console.log('OK: syntax, explicit approval, same-source crosspost, safety checks');
