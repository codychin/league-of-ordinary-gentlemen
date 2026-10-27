import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const source=readFileSync('app/articles/marnie-detroit-school.js','utf8');
const article=JSON.parse(source.replace(/^export const detroitSchoolArticle = /,'').replace(/;\s*$/,''));

test('Detroit School uses the owner-confirmed Gibbs and Williams plates in their respective sections',()=>{
  // Asset filenames predate the owner's corrected identification; preserve the actual selected frames.
  const expected=[
    ['I. Genesis: The Gibbs Proposition','/images/editorial/detroit-school/jameson.webp','Jahmyr Gibbs'],
    ['III. Jameson Williams and the Rejection of Consensus','/images/editorial/detroit-school/genesis.webp','Jameson Williams'],
  ];
  for(const [heading,src,person] of expected){
    const index=article.body.findIndex(item=>item?.type==='heading'&&item.text===heading);
    assert.ok(index>=0);
    const plate=article.body[index+1];
    assert.equal(plate.type,'image');
    assert.equal(plate.src,src);
    assert.ok(plate.alt.startsWith(person));
    assert.ok(existsSync('public'+plate.src));
  }
});
