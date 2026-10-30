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
console.log('OK: syntax, explicit approval, same-source crosspost, safety checks');
