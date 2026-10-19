import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {previewAllowed} from '../lib/voice-newsroom/config.mjs';
const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source = read('lib/voice-newsroom/ui/app.js').replace(/^import .*;\n/,'');
function harness(responder) {
  const elements = new Map(), requests=[];
  const node = () => ({disabled:false,textContent:'',append(){},replaceChildren(){}});
  const document = {getElementById(id){if(!elements.has(id))elements.set(id,node());return elements.get(id);},createElement:node,addEventListener(){}};
  const fetch = async (url,options) => {
    requests.push({url,options});
    if(url==='/api/private-newsroom/status')return {ok:true,json:async()=>({mode:'offline',paidCallsEnabled:false,cast:{}})};
    return responder(url,options);
  };
  vm.runInNewContext(source,{document,fetch,window:{addEventListener(){}},navigator:{},Blob,AbortController,setTimeout,clearTimeout});
  return {elements,requests,click:()=>elements.get('readiness').onclick(),result:()=>elements.get('readiness-result').textContent};
}
test('owner desk link is after anonymous return and owner+exact-preview gated',()=>{
 const page=read('app/manage/page.js');
 assert.ok(page.indexOf('if (!session.user) return <Login/>;') < page.indexOf('href="/manage/newsroom"'));
 assert.match(page,/session\.owner && previewAllowed\(\) && <p><Link href="\/manage\/newsroom"/);
 for(const env of [{},{VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'codex/private-voice-newsroom'},{VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'main'}])assert.equal(previewAllowed(env),false);
 assert.equal(previewAllowed({VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'codex/private-voice-newsroom'}),true);
 assert.match(read('lib/voice-newsroom/ui/index.html'),/<a href="\/manage">Back to owner desk<\/a>/);
});
test('readiness uses only same-origin metadata GET, suppresses double clicks and reenables',async()=>{
 let resolve;const pending=new Promise(r=>resolve=r);
 const h=harness(()=>pending);const first=h.click();await h.click();
 assert.equal(h.elements.get('readiness').disabled,true);
 assert.equal(h.requests.filter(r=>r.url.endsWith('/readiness')).length,1);
 resolve({ok:true,status:200,json:async()=>({models:{'gpt-4.1-mini':true,'gpt-4o-mini-transcribe':true,'tts-1-hd':true}})});
 await first;
 assert.match(h.result(),/all three model metadata checks passed/);
 assert.equal(h.elements.get('readiness').disabled,false);
 for(const req of h.requests){assert.ok(['/api/private-newsroom/status','/api/private-newsroom/readiness'].includes(req.url));assert.equal(req.options.method,undefined);assert.equal(req.options.body,undefined);assert.equal(req.options.headers,undefined);}
 const req=h.requests.find(r=>r.url.endsWith('/readiness'));assert.equal(req.options.credentials,'same-origin');assert.equal(req.options.cache,'no-store');
});
for(const status of [401,403])test(`readiness ${status} gives same-tab login guidance without parsing error payload`,async()=>{
 const h=harness(()=>({ok:false,status,json(){throw Error('SECRET_TOKEN');}}));await h.click();assert.match(h.result(),/Back to owner desk/);assert.match(h.result(),/Stay in this browser/);assert.doesNotMatch(h.result(),/SECRET_TOKEN/);assert.equal(h.elements.get('readiness').disabled,false);
});
test('readiness errors cannot expose arbitrary provider or parse exception text',async()=>{
 for(const responder of [()=>{throw Error('SECRET_TOKEN');},()=>({ok:false,status:500,json:async()=>({error:'SECRET_TOKEN'})}),()=>({ok:true,status:200,json:async()=>{throw Error('Unexpected SECRET_TOKEN');}})]){
 const h=harness(responder);await h.click();assert.doesNotMatch(h.result(),/SECRET_TOKEN/);assert.match(h.result(),/could not complete/);assert.equal(h.elements.get('readiness').disabled,false);
 }
});
test('missing metadata is not falsely reported ready or reflected into markup',async()=>{
 const h=harness(()=>({ok:true,status:200,json:async()=>({models:{'gpt-4.1-mini':true},error:'<script>SECRET_TOKEN</script>'})}));await h.click();assert.match(h.result(),/gpt-4o-mini-transcribe, tts-1-hd/);assert.doesNotMatch(h.result(),/all three|SECRET_TOKEN|script/);
});
