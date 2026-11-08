import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const hash=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,message)=>{if(!ok)throw Error(message);};
export function restoreWeek9Previews(root=process.cwd()) {
 const file=path.join(root,'media-sources/week9-preview/manifest.json');
 if(!fs.existsSync(file)) {
  need(!fs.existsSync(path.join(root,'data/week9-approved-homepage-media.json')),'Released preview manifest requires durable source manifest');return;
 }
 const manifest=JSON.parse(fs.readFileSync(file));
 need(manifest.version===1 && manifest.originals?.length===5,'Exact five chunked preview originals required');
 need(new Set(manifest.originals.map(r=>r.path)).size===5,'Duplicate preview original');
 const check=(bytes,r)=>need(bytes.length===r.bytes && hash(bytes)===r.sha256,'Preview media integrity failure: '+r.path);
 for(const r of manifest.originals) {
  need(/^public\/reels\/[a-f0-9]{32}\.mp4$/.test(r.path),'Unsafe original destination');
  const id=path.basename(r.path,'.mp4');
  need(r.parts?.length===2,'Exact ordered source parts required');
  const bytes=Buffer.concat(r.parts.map((p,i)=>{
   need(p.path===`media-sources/week9-preview/${id}/part_${String(i).padStart(3,'0')}.bin`,'Unsafe or out-of-order source part');
   const b=fs.readFileSync(path.join(root,p.path));check(b,p);return b;
  }));check(bytes,r);
  const dest=path.join(root,r.path);fs.mkdirSync(path.dirname(dest),{recursive:true});
  if(fs.existsSync(dest))check(fs.readFileSync(dest),r);else fs.writeFileSync(dest,bytes,{flag:'wx'});
 }
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)restoreWeek9Previews();
