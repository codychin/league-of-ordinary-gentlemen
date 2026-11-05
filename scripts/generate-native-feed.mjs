// Rebuild the public reader snapshot from the same canonical sources as the site.
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {validateLiveSnapshot} from '../native/brief/src/live-snapshot.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root+'native/brief');
await import('../native/brief/scripts/generate.mjs');
const feed=JSON.parse(await readFile('src/generated/feed.json','utf8'));
const presentation=JSON.parse(await readFile('src/generated/presentation.json','utf8'));
const snapshot={...feed,version:2,complete:true,publishedAt:Date.now(),presentation};
const commit=process.env.VERCEL_GIT_COMMIT_SHA || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
snapshot.revision=createHash('sha256').update(JSON.stringify({...snapshot,publishedAt:0,commit})).digest('hex');
// A deployment revision changes local media cache keys even for a replaced file at the same path.
function versionMedia(value){
 if(!value||typeof value!=='object')return;
 for(const [key,item] of Object.entries(value)){
  if(['image','src','poster','fallbackPoster'].includes(key)&&typeof item==='string'&&item.startsWith('/')&&!item.startsWith('//'))value[key]=item+(item.includes('?')?'&':'?')+'brief_rev='+snapshot.revision.slice(0,16);
  else versionMedia(item);
 }
}
versionMedia(snapshot);
validateLiveSnapshot(snapshot);
await mkdir(root+'lib/generated' ,{recursive:true});
await writeFile(root+'lib/generated/native-feed.json',JSON.stringify(snapshot));
console.log(`Public native feed: ${snapshot.cards.length} articles; revision ${snapshot.revision.slice(0,12)}`);
