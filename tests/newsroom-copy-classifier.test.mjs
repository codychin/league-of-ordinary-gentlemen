import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isNewsroomCopyOnlyChange,NEWSROOM_COPY_PATH} from '../scripts/operations/classify-newsroom-copy.mjs';
const source=readFileSync(NEWSROOM_COPY_PATH,'utf8');
const original=JSON.parse(source.replace(/^\s*export const newsroomApologyArticle\s*=\s*/,'').replace(/;\s*$/,''));
const module=article=>'export const newsroomApologyArticle = '+JSON.stringify(article,null,2)+';\n';
function changed(edit){const article=structuredClone(original);edit(article);return module(article);}
function denied(name,edit){test(name,()=>assert.equal(isNewsroomCopyOnlyChange(source,changed(edit)),false));}
test('actual article qualifies without changes',()=>assert.equal(isNewsroomCopyOnlyChange(source,source),true));
for(const field of ['title','dek'])test('literal '+field+' edit allowed',()=>assert.equal(isNewsroomCopyOnlyChange(source,changed(a=>{a[field]+=' Revised.';})),true));
test('plain paragraphs can change at their existing positions',()=>assert.equal(isNewsroomCopyOnlyChange(source,changed(a=>{a.body[0]='Dear civilization,';a.body[1]='We have further thoughts.';})),true));
test('JSON formatting and object-key order are semantically inert',()=>{
 const reversed=Object.fromEntries(Object.entries(original).reverse());assert.equal(isNewsroomCopyOnlyChange(source,module(reversed)),true);
});
for(const field of ['week','section','image','imageAlt','date','author','collectiveByline'])denied('metadata remains fixed: '+field,a=>{a[field]=typeof a[field]==='number'?a[field]+1:a[field]+' changed';});
for(const field of ['id','url','videoSrc','caption','showCaption'])denied('clip field remains fixed: '+field,a=>{const clip=a.body.find(b=>b.type==='xclip');clip[field]=typeof clip[field]==='boolean'?!clip[field]:clip[field]+' changed';});
for(const field of ['name','src','width','height','maxWidth'])denied('signature field remains fixed: '+field,a=>{const s=a.body.find(b=>b.type==='signatures').signatures[0];s[field]=typeof s[field]==='number'?s[field]+1:s[field]+' changed';});
denied('signature count fixed',a=>a.body.find(b=>b.type==='signatures').signatures.pop());
denied('signature ordering fixed',a=>a.body.find(b=>b.type==='signatures').signatures.reverse());
denied('body insertion rejected',a=>a.body.push('Added paragraph'));
denied('body deletion rejected',a=>a.body.shift());
denied('moving structural block rejected',a=>{const i=a.body.findIndex(b=>b.type==='break');[a.body[i],a.body[i+1]]=[a.body[i+1],a.body[i]];});
denied('string-to-object rejected',a=>{a.body[0]={type:'rich',html:'changed'};});
denied('object-to-string rejected',a=>{a.body[a.body.findIndex(b=>b.type==='break')]='changed';});
denied('unknown top-level key rejected',a=>{a.newRuntimeFeature=true;});
denied('removed top-level key rejected',a=>{delete a.image;});
denied('unknown block field rejected',a=>{a.body.find(b=>b.type==='break').spacing=500;});
denied('unknown block type rejected',a=>{a.body[a.body.findIndex(b=>b.type==='break')]={type:'heading',text:'Heading'};});
for(const value of ['', ' ', null, 42, '<b>HTML</b>','*emphasis*','two\nlines','control\u0000byte','x'.repeat(20_001)]){
 denied('nonplain paragraph rejected: '+JSON.stringify(value).slice(0,40),a=>{a.body[0]=value;});
 denied('nonplain title rejected: '+JSON.stringify(value).slice(0,40),a=>{a.title=value;});
}
for(const bad of [
 source+'\nglobalThis.__COPY_EVALUATED__=true;',
 'globalThis.__COPY_EVALUATED__=true;\n'+source,
 source.replace('newsroomApologyArticle','someOtherArticle'),
 source.replace('export const','export let'),
 source.replace('export const','const'),
 source.replace('"week": 11','"week": 11, "week": 11'),
 source.replace('"type": "xclip"','"type": "xclip", "type": "xclip"'),
 source.replace('"week": 11','"week": (() => { globalThis.__COPY_EVALUATED__=true; return 11; })()'),
 source.replace('"week": 11','"week": 11 /* comment */'),
 source.replace('"week": 11','"__proto__": {}, "week": 11'),
 source.replace('"week": 11','"week": NaN'),
 source.replace('"week": 11','"week": Infinity'),
 source.replace('"week": 11','"week": 01'),
 source.replace('"week": 11','"week": 11,'),
 'export const newsroomApologyArticle = {};',
 '', null, undefined,
]) test('unknown/ambiguous/non-JSON source rejected '+String(bad).slice(0,55),()=>{
 delete globalThis.__COPY_EVALUATED__;
 assert.equal(isNewsroomCopyOnlyChange(source,bad),false);
 assert.equal(isNewsroomCopyOnlyChange(bad,source),false);
 assert.equal(globalThis.__COPY_EVALUATED__,undefined);
});
test('JSON escape representations preserve same text',()=>assert.equal(isNewsroomCopyOnlyChange(source,source.replace('"title"','"\\u0074itle"')),true));
test('escaped duplicate keys cannot bypass detection',()=>assert.equal(isNewsroomCopyOnlyChange(source,source.replace('"week": 11','"week": 11, "\\u0077eek": 11')),false));
test('source size bound fails closed',()=>assert.equal(isNewsroomCopyOnlyChange(source,' '.repeat(1_000_001)),false));
test('before source must have the audited schema too',()=>{
 const baseline=changed(a=>{a.unknown='preserved';});assert.equal(isNewsroomCopyOnlyChange(baseline,baseline),false);
});
