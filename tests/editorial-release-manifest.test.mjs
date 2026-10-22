import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const manifest=JSON.parse(read('qa/editorial-release.json'));
const front=read('app/components/SharedEditorialFront.js');
const stories=[manifest.lead,...manifest.carousel];
test('release uses the existing v1 manifest schema with the explicitly approved production placement',()=>{
 assert.deepEqual(Object.keys(manifest).sort(),['baseline','carousel','editions','lead','schemaVersion']);
 assert.equal(manifest.schemaVersion,1);
 assert.equal(manifest.baseline.status,'editorially-approved');
 assert.equal(manifest.baseline.approval.approvedBy,'Cody Chin');
 assert.match(manifest.baseline.approval.scope,/Production publication/);
 assert.deepEqual(manifest.editions,[{id:'loog',path:'/'},{id:'sunday-crew',path:'/sunday-crew'},{id:'doge',path:'/doge'}]);
 assert.deepEqual(stories,[
  {slug:'conrad-allow-me-to-reintroduce-myself',title:'Allow Me to Reintroduce Myself'},
  {slug:'marnie-delicate-etiquette-sporting-pat',title:'The Delicate Etiquette of a Sporting Pat'},
  {slug:'conrad-jalen-hurts-too-sick-to-sleep',title:'The Medical Clearance Industrial Complex'},
  {slug:'hollis-rams-kicker-weight',title:'The Rams Have Lost 89 Pounds at Kicker'}
 ]);
});
test('manifest agrees with source order while West Virginia remains archive-only and routable',()=>{
 const lead=front.slice(front.indexOf('<section'),front.indexOf('<section className={front.recent}'));
 assert.ok(lead.includes('/articles/'+manifest.lead.slug));
 assert.ok(lead.includes('<h2>'+manifest.lead.title+'</h2>'));
 const recent=front.match(/<section className=\{front\.recent\}[^>]*>([\s\S]*?)<\/section>/)[1];
 assert.equal((recent.match(/<article className=\{front\.card\}/g)||[]).length,3);
 assert.deepEqual([...recent.matchAll(/href=\{root\+"\/articles\/([^"]+)"\}/g)].map(m=>m[1]),manifest.carousel.map(x=>x.slug));
 for(const story of manifest.carousel)assert.ok(recent.includes('<h3>'+story.title+'</h3>'));
 assert.ok(!front.includes('hollis-west-virginia-medical-assistance'));
 assert.match(read('app/articles/data.js'),/'hollis-west-virginia-medical-assistance': hollisWestVirginiaMedicalAssistance/);
 assert.ok(read('lib/editorial-scope.js').includes("'hollis-west-virginia-medical-assistance'"));
 assert.match(read('app/articles/data.js'),/export const archive=Object.entries\(articles\)/);
});
