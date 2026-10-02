import {readFileSync, readdirSync, mkdirSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const expected = {"abc29d09e4dffce0486b7a92608e2414": "89f17cb623cc486c5267c772d95c5d751db952bbda5d4190c61425dc5dc1f384", "ffc21da84192b47902925f46c3635b04": "aad64691362b205cd173160023131a584f725c8cb17e86248cb7337928482e52"};
mkdirSync('public/reels', {recursive:true});
for (const [id, hash] of Object.entries(expected)) {
  const dir=join('media-sources/sunday-review', id);
  const parts=readdirSync(dir).filter(f=>/^part_\d+\.bin$/.test(f)).sort();
  const bytes=Buffer.concat(parts.map(f=>readFileSync(join(dir,f))));
  if(createHash('sha256').update(bytes).digest('hex')!==hash) throw new Error('Video integrity failure: '+id);
  writeFileSync(join('public/reels', id+'.mp4'),bytes);
}
