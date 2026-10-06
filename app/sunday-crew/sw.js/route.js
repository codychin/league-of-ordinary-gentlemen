import {readFile} from 'node:fs/promises';
import path from 'node:path';
export async function GET(){
  const source=await readFile(path.join(process.cwd(),'public/sw.js'),'utf8');
  const scoped=source.replace("const VERSION='ordinary-brief-", "const VERSION='sunday-crew-brief-").replace("key.startsWith('ordinary-brief-')", "key.startsWith('sunday-crew-brief-')");
  return new Response(scoped,{headers:{'Content-Type':'application/javascript','Cache-Control':'no-cache','Service-Worker-Allowed':'/sunday-crew'}});
}
