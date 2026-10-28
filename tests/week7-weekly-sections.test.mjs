import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url));
const read=p=>JSON.parse(raw('data/'+p+'.json'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const picks=read('week7-start-sit'), autopsies=read('week7-autopsies');
const editions=['loog','sunday-crew','doge'];
test('Week 7 weekly sections retain final source identities and numerical fields',()=>{
 for(const [data,expected] of [[picks,'1cbb4497025b60e68786976b8ca5b74fe6122aa0456016e6ecd4f587facdd580'],[autopsies,'6d4d3001048b522f47a1976a3867c7e111b2b4f59c2b841d41bacf1d28ea4dbd']]){
  const immutable=structuredClone(data);
  for(const ed of editions){
   const v=immutable[ed];assert.equal(v.week,7);assert.equal(v.season,2026);assert.equal(v.status,'FINAL');
   delete v.reviewStatus;
   for(const row of v.picks||v.findings){delete row.headline;delete row.title;delete row.body;}
  }
  assert.equal(hash(JSON.stringify(immutable)),expected);
 }
 assert.deepEqual(editions.map(ed=>picks[ed].picks.length),[2,2,2]);
 assert.deepEqual(editions.map(ed=>autopsies[ed].findings.length),[2,3,6]);
 assert.deepEqual(read('doge-autopsy'),autopsies.doge);
});
test('six picks and eleven findings preserve the exact approved revision 2 copy',()=>{
 const copy=Object.fromEntries(editions.map(ed=>[ed,{
  picks:picks[ed].picks.map(p=>[p.headline,p.body]),
  findings:autopsies[ed].findings.map(f=>[f.title,f.body])
 }]));
 assert.equal(hash(JSON.stringify(copy)),'18af4161c0f0602758ab16b3df964247da952f0962145f2c4e72a3c2f90392d7');
 for(const ed of editions){assert.equal(picks[ed].reviewStatus,'APPROVED_REVISION_2');assert.equal(autopsies[ed].reviewStatus,'APPROVED_REVISION_2');}
});
test('Week 6 weekly history remains byte-identical',()=>{
 assert.equal(hash(raw('data/week6-start-sit.json')),'a60d3c72afd88808f0a1152ba84d818c45e673306765986273476f986cd0007e');
 assert.equal(hash(raw('data/week6-autopsies.json')),'470ac7e4fe8781fe90c80c9ff54e7b6942eb2c817ad71d25eb87416108cb09d9');
});
test('all edition adapters use Week 7 while sharing one StartSit component',()=>{
 assert.match(raw('app/components/StartSitOfWeek.jsx').toString(),/data\/week7-start-sit.json/);
 for(const component of ['LoogAutopsy','SundayCrewAutopsy'])assert.match(raw('app/components/'+component+'.jsx').toString(),/data\/week7-autopsies.json/);
 const config=raw('lib/edition-content.js').toString();
 assert.match(config,/week7Autopsies\.doge\.findings/);
 assert.match(config,/autopsy:dogeAutopsy/);
});
