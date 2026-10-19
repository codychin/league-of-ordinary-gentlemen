import {readFile} from 'node:fs/promises';import path from 'node:path';
export async function loadCanon(){const files=['culture.md','benchmarks.md','latest-direction.md'];const contents=await Promise.all(files.map(f=>readFile(path.join(process.cwd(),'lib/voice-newsroom/canon',f),'utf8')));if(contents.some(c=>!c.trim()))throw Error('Canonical guidance missing');return contents.join('\n\n');}
