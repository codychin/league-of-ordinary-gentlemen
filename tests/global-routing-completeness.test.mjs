import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const front=readFileSync('app/components/SharedEditorialFront.js','utf8');
const scope=readFileSync('lib/editorial-scope.js','utf8');
const data=readFileSync('app/articles/data.js','utf8');
const edition=readFileSync('app/components/editions/Article.js','utf8');
test('all shared homepage article links route in every league',()=>{
 assert.match(edition,/isGlobalArticle\(slug\)/);
 const slugs=[...front.matchAll(/root\+"\/articles\/([a-z0-9-]+)"/g)].map(m=>m[1]);
 assert.ok(slugs.length>8);
 for(const slug of slugs){
  assert.ok(scope.includes("'"+slug+"'"),'GLOBAL ROUTING MISSING: '+slug);
  assert.ok(data.includes("'"+slug+"':")||data.includes('"'+slug+'":'),'GLOBAL ARTICLE DATA MISSING: '+slug);
 }
});
test('global three-card limit never silently grows',()=>{
 const section=front.match(/<section className=\{front\.recent\}[^>]*>([\s\S]*?)<\/section>/);
 assert.ok(section);
 assert.equal((section[1].match(/<article className=\{front\.card\}/g)||[]).length,3);
});
