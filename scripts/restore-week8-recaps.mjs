import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const hash=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,message)=>{if(!ok)throw Error(message);};
function check(bytes,record){need(bytes.length===record.bytes && hash(bytes)===record.sha256,'Recap media integrity failure: '+record.path);}
export function restoreWeek8Recaps(root=process.cwd()) {
 const file=path.join(root,'media-sources/week8-recap/manifest.json');
 if(!fs.existsSync(file)) {
  need(!fs.existsSync(path.join(root,'data/week8-recap-approved-homepage-media.json')),'Released recap manifest requires durable source manifest');
  return;
 }
 const manifest=JSON.parse(fs.readFileSync(file));
 need(manifest.version===1 && manifest.originals?.length===18,'Exact eighteen-original transport manifest required');
 const originalPaths=new Set(manifest.originals.map(r=>r.path));
 need(originalPaths.size===18,'Duplicate recap original');
 const load=record=>{
  need(record.parts?.length>0,'Ordered recap parts required');
  const bytes=Buffer.concat(record.parts.map((p,i)=>{
   need(/^media-sources\/week8-recap\/(?:[a-f0-9]{32}|hls)\/part_\d{3}\.bin$/.test(p.path) && p.path.endsWith(`part_${String(i).padStart(3,'0')}.bin`),'Unsafe or out-of-order source part');
   const b=fs.readFileSync(path.join(root,p.path));check(b,p);return b;
  }));
  check(bytes,record);return bytes;
 };
 const install=(bytes,record)=>{
  check(bytes,record);const dest=path.join(root,record.path);fs.mkdirSync(path.dirname(dest),{recursive:true});
  if(fs.existsSync(dest)){check(fs.readFileSync(dest),record);return;}
  fs.writeFileSync(dest,bytes,{flag:'wx'});
 };
 for(const record of manifest.originals) {
  need(/^public\/reels\/[a-f0-9]{32}\.mp4$/.test(record.path),'Unsafe original destination');
  install(load(record),record);
 }
 const bundle=manifest.hlsBundle,bytes=load(bundle),files=bundle.files;
 need(Array.isArray(files) && new Set(files.map(f=>f.path)).size===files.length,'Unique HLS files required');
 let offset=0;
 for(const f of files) {
  need(/^public\/reels-hls\/[a-f0-9]{32}\/(?:poster\.jpg|index\.m3u8|init\.mp4|seg_\d{3}\.m4s)$/.test(f.path),'Unsafe HLS destination');
  need(originalPaths.has(`public/reels/${f.path.split('/')[2]}.mp4`) && f.offset===offset && f.bytes>0,'HLS source binding or offset mismatch');
  install(bytes.subarray(f.offset,f.offset+f.bytes),f);offset+=f.bytes;
 }
 need(offset===bytes.length,'Trailing or missing HLS bytes');
 for(const original of manifest.originals)for(const name of ['poster.jpg','index.m3u8','init.mp4','seg_000.m4s'])need(files.some(f=>f.path===`public/reels-hls/${path.basename(original.path,'.mp4')}/${name}`),'Incomplete HLS package');
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)restoreWeek8Recaps();
