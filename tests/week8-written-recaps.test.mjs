import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {selectMatchupColumn} from '../lib/select-matchup-column.mjs';
const recaps=JSON.parse(readFileSync(new URL('../data/matchup-recaps.json',import.meta.url)));
const expected={
  "loog:1-3": "96442986ebf4e3b82dfab148a089a9ba74fb20dd73870fc2053edcd16e031f85",
  "loog:2-10": "8f0dfe24b66d66da1c11a00427c43e89138f62bb12f60701592586a0f59e6d02",
  "loog:4-11": "a360dd70282b631a7596e62be8fabbc08979ea8ec453172f73a9067c76b06cc9",
  "loog:5-12": "4d5ec38bb4601051502625307a6a63653b8a2325d9d6a9abd68a61960885911e",
  "loog:6-9": "080f44dceeaab0ab210ac70cbe3c3b18674dfdaf6bc611878da50f98fbd2d2cc",
  "loog:7-8": "4ae1e1a5ddd1a679959226ad33329c1ddedd8f4e2d4121ca8b9a00b83949ec91",
  "doge:1-3": "2f880d7d913a7b13aca1ba23eec7eeb496d4e8fcff82ef283b09b4c407994ba2",
  "doge:2-10": "d1c5fd86187c43deb1de45d8f5e002213d91b1a7e78723b6dee5da12af8a32ec",
  "doge:4-5": "8f4a0436c12fed1e2a0e49d558318d808ba7dbfda138af744c671dd8670b389e",
  "doge:6-7": "f3e531c949769f61753a07315290bdc966dd2c10ad686ba11f203a5fa41c4965",
  "doge:8-11": "74fe0d2b8f516b5e890572c592d5288c8180b94504b75caf687276abade8095f",
  "doge:9-12": "9fcc89f9c40c7b870b262c808afc7ab3b91cc9137d8e4dc953e70cf063a13965",
  "sunday-crew:1-4": "25991cc96eb747d1098dec37d94c36c27e17382f08f58eb74c401da85a54900a",
  "sunday-crew:11-12": "051562e69ad9437dce74d70c3087c4d5bccc7ff25ac269a7b4c57b184c851f82",
  "sunday-crew:2-5": "27a52bfd479267fae827445c5d4fa039c5a3e8ed485107c77e8777fdd2621203",
  "sunday-crew:3-9": "c6b8f3aadb3f81fb1dce0e55df51e299d771892406e4213f4b2d8bad4bb58020",
  "sunday-crew:6-7": "ce51f880fe6cdb4c0f9b5f2edc856fa149ccde896d7f67875fff06c4b932d818",
  "sunday-crew:8-10": "f79f439d6d4ef323df2c1cff58b89f0dca82a6796fd14fc8d6e8fe36e3d5f69b"
};
for(const edition of ['loog','sunday-crew','doge'])test(`${edition} Week 8 final recap coverage and reviewed bytes`,()=>{
 const items=recaps.filter(x=>x.edition===edition&&x.season===2026&&x.week===8&&x.kind==='recap');
 assert.equal(items.length,6);
 for(const c of items){
  const key=edition+':'+[...c.teamIds].sort((a,b)=>Number(a)-Number(b)).join('-');
  assert.ok(expected[key],key);
  assert.equal(createHash('sha256').update(c.body).digest('hex'),expected[key]);
  assert.equal(c.source.bodySha256,expected[key]);
  assert.equal(c.source.status,'FINAL');
  assert.ok(c.body.split(/\n\n+/).length>=3);
  assert.ok(c.body.split(/\s+/).length>=190);
  const [a,b]=c.teamIds,args={recaps,edition,season:2026,week:8,a,b,isFinal:true};
  assert.equal(selectMatchupColumn(args),c);
  assert.equal(selectMatchupColumn({...args,a:b,b:a}),c);
  assert.equal(selectMatchupColumn({...args,isFinal:false}),null);
 }
});
