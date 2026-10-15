// Materialize public editorial imagery at build time, never on a reader's request.
import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

// Trim only the baked-in beige side gutters of the Rams graphic during the build.
// Preserve every label, player and the full vertical composition; source stays immutable.
const ramsAsset='public/images/editorial/rams-unit-short-king.png';
const ramsOriginal=await readFile(ramsAsset);
const ramsMeta=await sharp(ramsOriginal).metadata();
const side=Math.round(ramsMeta.width*0.135);
if(!ramsMeta.width||!ramsMeta.height||side*2>=ramsMeta.width)throw Error('Invalid Rams graphic dimensions');
await writeFile(ramsAsset,await sharp(ramsOriginal).extract({left:side,top:0,width:ramsMeta.width-side*2,height:ramsMeta.height}).png().toBuffer());

const sources=new Set();
async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){if(!p.includes('generated')&&!p.includes('media-admin')&&!p.includes('/manage'))await scan(p)}else if(/\.(jsx?|css)$/.test(p)){const s=await readFile(p,'utf8');for(const m of s.matchAll(/(?:https:\/\/[^\s'"`<>)}]+|\/images\/[^\s'"`<>)}]+|\/api\/[\w.-]+(?:-image|\.jpg))/g)){const u=m[0];if(/\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(u)||u.startsWith('/images/')||u.startsWith('/api/')||u.includes('static.clubs.nfl.com/image/')){if(!u.startsWith('/images/cache/'))sources.add(u)}}}}}
await scan('app');await scan('lib');
await mkdir('public/images/cache',{recursive:true});await mkdir('lib/generated',{recursive:true});
let previous={};try{previous=JSON.parse(await readFile('lib/generated/image-manifest.json','utf8'))}catch{}
const manifest={...previous};const failures=[];
async function prepare(src){try{
 const old=previous[src];if(old&&!src.startsWith('/images/')&&!process.argv.includes('--refresh')&&await stat('public'+old.src).catch(()=>null)){manifest[src]=old;return}
 let input;if(src.startsWith('/images/'))input=await readFile('public'+src);else{
 let url=src;if(src.startsWith('/api/')){const route=await readFile('app'+src+'/route.js','utf8').catch(()=> '');url=route.match(/const SOURCE=['"]([^'"]+)/)?.[1]||'https://www.ordinarybrief.com'+src}
 const response=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{accept:'image/*','user-agent':'TheBrief-EditorialAssetBuild/1.0'}});if(!response.ok)throw Error('HTTP '+response.status);input=Buffer.from(await response.arrayBuffer());if(input.length>20000000)throw Error('Image too large');
 }
 const meta=await sharp(input,{failOn:'none'}).metadata();if(!meta.width||!meta.height||meta.pages>1)throw Error('Unsupported image');
 const id=createHash('sha256').update(input).update('webp-v1').digest('hex').slice(0,20);const variants={};
 for(const width of [320,640,1280]){const file=`/images/cache/${id}-${width}.webp`;await sharp(input,{failOn:'none'}).rotate().resize({width,withoutEnlargement:true}).webp({quality:78}).toFile('public'+file);variants[width]=file}
 const blur=await sharp(input,{failOn:'none'}).rotate().resize({width:20}).webp({quality:35}).toBuffer();
 manifest[src]={src:variants[1280],variants,width:meta.width,height:meta.height,blur:'data:image/webp;base64,'+blur.toString('base64')};
}catch(e){if(previous[src])manifest[src]=previous[src];failures.push({src,error:e.message})}}
const queue=[...new Set([...sources,...Object.keys(previous)])];await Promise.all(Array.from({length:6},async()=>{while(queue.length)await prepare(queue.shift())}));
await writeFile('lib/generated/image-manifest.json',JSON.stringify(manifest));
console.log(`Editorial assets: ${Object.keys(manifest).length} ready; ${failures.length} upstream images unavailable (original URLs retained).`);
if(failures.length)console.log(JSON.stringify(failures));
// CSS-only legacy cards also use local copies; keep their existing layout/crop rules.
for(const name of await readdir('app'))if(name.endsWith('.css')){
 const file='app/'+name;const css=await readFile(file,'utf8');
 const rewritten=css.replace(/url\(['"]?([^'"\)]+)['"]?\)/g,(whole,url)=>manifest[url]?`url('${manifest[url].variants[640]}')`:whole);
 if(css!==rewritten)await writeFile(file,rewritten);
}
