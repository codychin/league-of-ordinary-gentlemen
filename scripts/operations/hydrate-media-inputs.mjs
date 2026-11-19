// Restore acceleration is never release authority: verify every cached Git blob.
import {execFileSync} from 'node:child_process';
import {rm,lstat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {MEDIA_ROOTS,verifyMediaInputs} from './media-input-cache.mjs';
export async function hydrateMediaInputs(root=process.cwd(),hydrate) {
 root=resolve(root);
 try {const result=await verifyMediaInputs(root);return {...result,source:'verified-cache'};}
 catch {
  // Only inert, owned checkout paths. Remove all partial inputs before fetching;
  // do not mix a bad archive with trusted Git files.
  const publicDir=await lstat(resolve(root,'public'));
  if(publicDir.isSymbolicLink()||!publicDir.isDirectory())throw Error('Unsafe media parent');
  for(const path of MEDIA_ROOTS)await rm(resolve(root,path),{recursive:true,force:true});
  if(hydrate)await hydrate(root);
  else execFileSync('git',['-c','safe.directory='+root,'-C',root,'sparse-checkout','disable'],{stdio:'inherit',timeout:900000});
  return {...await verifyMediaInputs(root),source:'verified-git'};
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try { console.log(JSON.stringify(await hydrateMediaInputs())); }
 catch {console.error('Media input hydration failed verification');process.exitCode=1;}
}
