// Read-only extraction from trusted repository source. Never evaluates submitted content.
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(p,'utf8');
const source=read('app/articles/data.js');
const bindings={};
for(const m of source.matchAll(/import \{(\w+)\} from '\.\/(.*?)'/g)){
 bindings[m[1]]=vm.runInNewContext(read('app/articles/'+m[2]+'.js').replace(/export const \w+ = /,'(').replace(/;\s*$/,')'));
}
const articles=vm.runInNewContext(source.replace(/^import .*$/gm,'').replace('export const articles =','const articles =').split('export const archive=')[0]+';articles',bindings);
const front=read('app/components/SharedEditorialFront.js');
const home=[...new Set([...front.matchAll(/root\+"\/articles\/([^"}]+)"/g)].map(m=>m[1]))];
const archive=['hollis-west-virginia-medical-assistance'];
const snapshot={home,archive,articles:Object.fromEntries([...home,...archive].map((slug,index)=>[slug,{...articles[slug],slug,scope:'global',order:index}]))};
const baseline={schemaVersion:1,renderer:'local-pilot-fixed-v1',sourceCommit:'4fc320847c983c17cfb18626fcfc7fe555dc09e0',editions:Object.fromEntries(['loog','sunday-crew','doge'].map(e=>[e,structuredClone(snapshot)])),assets:{}};
for(const path of ['/images/editorial/jay-z-lead.webp','/images/editorial/obama-self-medal-meme.jpg'])baseline.assets[path]=createHash('sha256').update(readFileSync('public'+path)).digest('hex');
writeFileSync('tests/fixtures/publishing-pilot/baseline.json',JSON.stringify(baseline,null,2)+'\n');
// Preserve the existing complete overflow presentation as a read-only renderer dependency.
const overflow=front.slice(front.indexOf('<section className="hero heroStack"'),front.indexOf('<div className={styles.archiveCta}>'));
const sections=[...overflow.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(m=>m[0]);
const entries=sections.map(section=>{const slug=section.match(/root\+"\/articles\/([^"]+)"/)[1];return `${JSON.stringify(slug)}: (${section}),`;});
const imports=front.slice(0,front.indexOf('// Lead/card'));
writeFileSync('app/publishing-pilot/LegacyOverflow.jsx',imports.replaceAll("'./","'../components/").replaceAll("'../../lib/","'../../lib/")+`\nfunction ImageLabel({byline,theme}){return <div className="actionCaption"><small>{byline}</small><b>{theme}</b></div>}\nexport default function LegacyOverflow({slug,root}){const sections={\n${entries.join('\n')}\n};return sections[slug]||null;}\n`);
console.log('Exported',home.length,'homepage stories; archive exception preserved.');
