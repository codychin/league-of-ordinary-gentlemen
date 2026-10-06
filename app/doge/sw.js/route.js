import {readFile} from 'node:fs/promises';
import path from 'node:path';
export async function GET(){const source=await readFile(path.join(process.cwd(),'public/sw.js'),'utf8');return new Response(source.replaceAll('ordinary-brief-', 'doge-brief-'),{headers:{'Content-Type':'application/javascript','Cache-Control':'no-cache','Service-Worker-Allowed':'/doge'}});}
