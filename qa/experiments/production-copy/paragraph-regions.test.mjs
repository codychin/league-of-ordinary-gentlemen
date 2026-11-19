import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyParagraphRegionChange as classify} from './paragraph-regions.mjs';
import {isNewsroomCopyOnlyChange} from '../../../scripts/operations/classify-newsroom-copy.mjs';
const source=readFileSync('app/articles/newsroom-ai-apology.js','utf8');
const article=JSON.parse(source.replace(/^\s*export const newsroomApologyArticle\s*=\s*/,'').replace(/;\s*$/,''));
const render=value=>'export const newsroomApologyArticle = '+JSON.stringify(value)+';\n';
function change(edit){const value=structuredClone(article);edit(value);return render(value);}
function deny(name,edit){test(name,()=>assert.equal(classify(source,change(edit)).eligible,false));}
const index=(a,type)=>a.body.findIndex(b=>b.type===type);
test('actual article no-change qualifies with zero delta',()=>assert.deepEqual(classify(source,source),{eligible:true,reason:'region-preserving-plain-insert-delete',inserted:0,deleted:0}));
for(const region of [0,1,2])test('insert within existing pre-signature region '+region,()=>{
 const next=change(a=>{const at=region===0?1:index(a,region===1?'xclip':'break')+1;a.body.splice(at,0,'A new paragraph unique to region '+region+'.');});
 assert.deepEqual(classify(source,next),{eligible:true,reason:'region-preserving-plain-insert-delete',inserted:1,deleted:0});
 assert.equal(isNewsroomCopyOnlyChange(source,next),false,'Active classifier behavior remains strict');
});
test('delete an interior paragraph while retaining region boundaries',()=>assert.deepEqual(classify(source,change(a=>a.body.splice(2,1))),{eligible:true,reason:'region-preserving-plain-insert-delete',inserted:0,deleted:1}));
test('combined insertion and conservative deletion',()=>assert.deepEqual(classify(source,change(a=>{a.body.splice(2,1,'Brand-new replacement prose.');})),{eligible:true,reason:'region-preserving-plain-insert-delete',inserted:1,deleted:1}));
deny('first region anchor cannot be deleted',a=>a.body.shift());
deny('last paragraph before embed cannot be deleted',a=>a.body.splice(index(a,'xclip')-1,1));
deny('existing paragraph cannot move past embed',a=>{const [p]=a.body.splice(2,1);a.body.splice(index(a,'xclip')+2,0,p);});
deny('existing paragraph cannot move past break',a=>{const [p]=a.body.splice(2,1);a.body.splice(index(a,'break')+2,0,p);});
deny('existing paragraph cannot move past signatures',a=>{const [p]=a.body.splice(2,1);a.body.push(p);});
deny('case or whitespace disguise cannot move text across region',a=>{const [p]=a.body.splice(2,1);a.body.splice(index(a,'break')+2,0,'  '+p.toUpperCase()+'  ');});
deny('paragraph order within a region cannot change',a=>{[a.body[2],a.body[3]]=[a.body[3],a.body[2]];});
deny('paragraph duplicate cannot masquerade as insertion',a=>a.body.splice(2,0,a.body[3]));
deny('normalized paragraph duplicate fails',a=>a.body.splice(2,0,' '+a.body[3].toUpperCase()+' '));
deny('no new text region may be created',a=>a.body.splice(2,0,{type:'break'}));
deny('new embed cannot be inserted',a=>a.body.splice(2,0,structuredClone(a.body[index(a,'xclip')])));
deny('nontext block cannot be deleted',a=>a.body.splice(index(a,'break'),1));
deny('nontext block ordering cannot change',a=>{const x=index(a,'xclip'),b=index(a,'break');[a.body[x],a.body[b]]=[a.body[b],a.body[x]];});
deny('changing embed URL rejected',a=>a.body[index(a,'xclip')].url+='?different');
deny('changing signature dimension rejected',a=>a.body[index(a,'signatures')].signatures[0].width++);
deny('changing signature identity rejected',a=>a.body[index(a,'signatures')].signatures[0].name='Other');
deny('Sincerely remains exactly fixed',a=>{a.body[index(a,'signatures')-1]='With love,';});
deny('nothing may be inserted between Sincerely and signatures',a=>a.body.splice(index(a,'signatures'),0,'Another signoff.'));
deny('trailing signoff remains exactly fixed',a=>{a.body[a.body.length-1]+=' Revised.';});
deny('trailing signoff cannot be deleted',a=>a.body.pop());
deny('trailing signoff cannot acquire a paragraph',a=>a.body.push('An extra closing.'));
deny('Sincerely cannot be copied into editable region',a=>a.body.splice(2,0,'Sincerely,'));
for(const key of ['title','dek','date','author','collectiveByline','image','imageAlt','section','week'])deny('top-level metadata fixed: '+key,a=>{a[key]=typeof a[key]==='number'?a[key]+1:a[key]+' revised';});
for(const text of ['',' ','*emphasis*','<iframe>','two\nlines','bad\u0000control','x'.repeat(20001)])deny('nonplain insertion rejected '+JSON.stringify(text).slice(0,30),a=>a.body.splice(2,0,text));
for(const value of [null,17,[],{type:'rich',html:'not plain'},{type:'heading',text:'new heading'}])deny('nonstring insertion rejected '+JSON.stringify(value),a=>a.body.splice(2,0,value));
for(const bad of [
 source.replace('"week": 11','"week": 11, "week": 11'),
 source.replace('"week": 11','"week": 11, "\\u0077eek": 11'),
 source+'\nglobalThis.__PRODUCTION_COPY_EXECUTED__=true;',
 'globalThis.__PRODUCTION_COPY_EXECUTED__=true;\n'+source,
 source.replace('"week": 11','"week": (()=>{globalThis.__PRODUCTION_COPY_EXECUTED__=true;return 11;})()'),
 source.replace('newsroomApologyArticle','differentExport'),
 source.replace('"week": 11','"__proto__": {}, "week": 11'),
 source.replace('"week": 11','"week": 11 /*comment*/'),
 '',null,undefined,
])test('ambiguous/executable/unknown source fails without execution '+String(bad).slice(0,45),()=>{
 delete globalThis.__PRODUCTION_COPY_EXECUTED__;
 assert.equal(classify(source,bad).eligible,false);assert.equal(classify(bad,source).eligible,false);
 assert.equal(globalThis.__PRODUCTION_COPY_EXECUTED__,undefined);
});
test('duplicate baseline paragraphs are conservatively unsupported',()=>{
 const before=change(a=>a.body.splice(2,0,a.body[3]));assert.equal(classify(before,before).eligible,false);
});
test('unknown baseline block schema is unsupported',()=>{
 const before=change(a=>a.body.splice(2,0,{type:'unknown'}));assert.equal(classify(before,before).eligible,false);
});
test('JSON formatting/key order does not invent a content difference',()=>{
 const reordered=Object.fromEntries(Object.entries(article).reverse());assert.equal(classify(source,render(reordered)).eligible,true);
});
test('classifier is pure and does not assert baseline approval or deploy authority',()=>{
 const result=classify(source,source);
 assert.equal(Object.hasOwn(result,'approved'),false);assert.equal(Object.hasOwn(result,'publish'),false);
 assert.equal(Object.hasOwn(result,'sha'),false);
});
deny('embed cannot shift across an existing paragraph while keeping object order',a=>{
 const at=index(a,'xclip');[a.body[at-1],a.body[at]]=[a.body[at],a.body[at-1]];
});
deny('break cannot shift across an existing paragraph while keeping object order',a=>{
 const at=index(a,'break');[a.body[at],a.body[at+1]]=[a.body[at+1],a.body[at]];
});
test('actual PR182 closing insertion replays against LIVE 9a7470 article fixture',()=>{
 const additions=[
  'To anyone using AI to break essential systems: please stop.',
  'Some of us are trying to run a deeply unserious publication in a reasonably intact world.',
 ];
 const current=structuredClone(article),signature=index(current,'signatures');
 assert.deepEqual(current.body.slice(signature-3,signature-1),additions,'Fixture must contain the exact two live closing paragraphs immediately before Sincerely');
 const before=structuredClone(current);before.body.splice(signature-3,2);
 assert.deepEqual(classify(render(before),source),{
  eligible:true,reason:'region-preserving-plain-insert-delete',inserted:2,deleted:0,
 });
 assert.equal(isNewsroomCopyOnlyChange(render(before),source),false,'Active classifier remains unchanged and does not admit insertions');
});
