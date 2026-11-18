import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('desktop and edition navigation promote crates without duplicate More links',()=>{
 for(const name of ['SiteNav.js','EditionSiteNav.js']){
  const source=read('app/components/'+name);
  assert.equal((source.match(/THE CRATES/g)||[]).length,1);
  assert.ok(source.indexOf('THE CRATES')<source.indexOf('<details'));
  assert.doesNotMatch(source,/>CULTURE</);
 }
});
test('mobile navigation routes to archives rather than a homepage hash',()=>{
 const source=read('app/components/PwaShell.jsx');
 assert.match(source,/href:archivePath,label:'Crates',tab:'crates'/);
 assert.match(source,/if\(item.tab==='crates'\)/);
 assert.match(source,/if\(isCrates\) return 'crates'/);
 assert.doesNotMatch(source,/<span>The Crates<\/span>/);
 assert.match(read('app/pwa.css'),/data-active-tab='crates'/);
});
test('pre-hydration app shell marks all archive and watch routes as crates',()=>{
 const source=read('app/layout.js').match(/const standaloneBoot=`([^`]+)`/)[1];
 for(const pathname of ['/archive','/archive/watch','/sunday-crew/archive','/sunday-crew/archive/watch','/doge/archive']){
  const document={documentElement:{classList:{add(){}},dataset:{}}};
  vm.runInNewContext(source,{document,URLSearchParams,location:{pathname,search:'?app-preview=1',hash:''},navigator:{},matchMedia:()=>({matches:false})});
  assert.equal(document.documentElement.dataset.appTab,'crates',pathname);
 }
});
