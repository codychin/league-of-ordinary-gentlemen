import fs from 'node:fs';
import path from 'node:path';
import {binding,preparationBinding} from '../../scripts/operations/prepare-media.mjs';
const manifest=JSON.parse(fs.readFileSync('qa/week7-recap-assets.json'));
const packet=JSON.parse(fs.readFileSync('qa/week7-recap-draft.json'));
const repo=process.cwd();
export function fixture(id=manifest.bindings[0].videoId) {
  const a=manifest.bindings.find(x=>x.videoId===id), e=packet.entries.find(x=>x.edition===a.edition&&x.teamIds.join('-')===a.pair.join('-'));
  const media=JSON.parse(fs.readFileSync('data/week7-approved-homepage-media.json')).find(r=>r.id===id);
  const row={id:e.scriptRegistryId,writer_slug:e.writer,metadata:{edition:e.edition,kind:'recap',season:2026,week:7,matchupKey:e.matchupKey,
    matchupTeamIds:e.teamIds,voiceId:media.voiceId,scriptRevision:e.scriptRevision,scriptSha256:e.scriptSha256,sourcePackageSha256:e.sourcePackageSha256,
    scriptApproved:true,approvalStatus:'exact_script_approved',videoGeneration:{status:'completed',videoId:id}}};
  const identity={bytes:a.sourceBytes,sha256:a.sourceSha256,gitBlobSha:a.sourceGitSha};
  const b=binding(row,identity);
  const prefix=`public/reels-hls/${id}/`;
  return {row,identity,source:{kind:'file',path:path.join(repo,`public/reels/${id}.mp4`)},
    preparationApproval:{status:'approved',binding:preparationBinding(b),evidence:'isolated test fixture only',expiresAt:'2026-10-29T00:00:00Z'},
    existingPackage:{videoId:id,sourceSha256:identity.sha256,path:path.join(repo,prefix),files:manifest.files.filter(f=>f.path.startsWith(prefix)).map(f=>({name:f.path.slice(prefix.length),identity:{bytes:f.bytes,sha256:f.sha256,gitBlobSha:f.sha}}))}};
}
