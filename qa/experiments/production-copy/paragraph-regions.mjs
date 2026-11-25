// Draft experiment only. Nothing imports this from an active release workflow.
// This proves a narrow data difference, not approval, deployment identity, UI
// suitability, editorial truth, or permission to publish.
import {isDeepStrictEqual} from 'node:util';
import {isNewsroomCopyOnlyChange} from '../../../scripts/operations/classify-newsroom-copy.mjs';

function parse(source) {
  // Reuse the active strict parser/schema via its no-change validation. Only
  // after duplicate keys, code, controls and unknown shapes are rejected do we
  // use JSON.parse; neither source is ever imported or evaluated.
  if (!isNewsroomCopyOnlyChange(source,source)) throw Error('invalid-module');
  const match=/^\s*export\s+const\s+newsroomApologyArticle\s*=\s*(\{[\s\S]*\})\s*;\s*$/.exec(source);
  if (!match) throw Error('invalid-module');
  return JSON.parse(match[1]);
}
const normalize=text=>text.normalize('NFKC').trim().replace(/\s+/gu,' ').toLowerCase();
function partition(article) {
  const signatureIndices=article.body.map((block,i)=>block?.type==='signatures'?i:-1).filter(i=>i>=0);
  if(signatureIndices.length!==1)throw Error('unknown-signature-structure');
  const index=signatureIndices[0];
  if(index<2 || article.body[index-1]!=='Sincerely,' || index===article.body.length-1 ||
      article.body.slice(index+1).some(block=>typeof block!=='string'))throw Error('unknown-signoff-structure');
  const immutableTail=article.body.slice(index-1);
  const regions=[[]],blocks=[];
  for(const block of article.body.slice(0,index-1)) {
    if(typeof block==='string')regions.at(-1).push(block);
    else {blocks.push(block);regions.push([]);}
  }
  if(regions.some(region=>region.length<2))throw Error('insufficient-region-anchors');
  return {regions,blocks,immutableTail};
}
export function classifyParagraphRegionChange(beforeSource,afterSource) {
  const deny=reason=>({eligible:false,reason});
  try {
    const before=parse(beforeSource),after=parse(afterSource);
    const metadata=article=>Object.fromEntries(Object.entries(article).filter(([key])=>key!=='body'));
    if(!isDeepStrictEqual(metadata(before),metadata(after)))return deny('metadata-changed');
    const old=partition(before),next=partition(after);
    if(!isDeepStrictEqual(old.blocks,next.blocks))return deny('nontext-blocks-changed');
    if(!isDeepStrictEqual(old.immutableTail,next.immutableTail))return deny('signoff-changed');
    if(old.regions.length!==next.regions.length)return deny('region-count-changed');
    const original=new Map(),seen=new Set();
    old.regions.forEach((region,r)=>region.forEach((text,i)=>{
      const key=normalize(text);
      if(original.has(key))throw Error('ambiguous-baseline-paragraphs');
      original.set(key,{region:r,index:i,text});
    }));
    // Signoff text may not be duplicated into editable prose regions either.
    const protectedText=new Set(old.immutableTail.filter(x=>typeof x==='string').map(normalize));
    let inserted=0,deleted=0;
    for(let r=0;r<old.regions.length;r++) {
      const indices=[];
      for(const text of next.regions[r]) {
        const key=normalize(text);
        if(seen.has(key)||protectedText.has(key))return deny('duplicate-or-protected-paragraph');
        seen.add(key);
        const previous=original.get(key);
        if(!previous){inserted++;continue;}
        if(previous.region!==r)return deny('paragraph-crossed-region');
        if(previous.text!==text)return deny('existing-paragraph-edited');
        if(indices.length&&previous.index<=indices.at(-1))return deny('paragraph-order-changed');
        indices.push(previous.index);
      }
      // Deletion is deliberately narrower than insertion. The original first
      // and last paragraph anchor each region and cannot disappear or move.
      if(indices[0]!==0||indices.at(-1)!==old.regions[r].length-1)return deny('region-anchor-removed');
      deleted+=old.regions[r].length-indices.length;
    }
    return {eligible:true,reason:'region-preserving-plain-insert-delete',inserted,deleted};
  } catch(error) {
    return deny(['unknown-signature-structure','unknown-signoff-structure','insufficient-region-anchors','ambiguous-baseline-paragraphs'].includes(error.message)?error.message:'invalid-module');
  }
}
export const isParagraphRegionOnlyChange=(before,after)=>classifyParagraphRegionChange(before,after).eligible;
